const html=document.querySelector('html'),body=document.querySelector('body'),grids=document.querySelectorAll(".grid-container"),gridItems=Array.from(grids).map(d=>Array.from(d.children)).reduce((acc,itemList)=>[...acc,...itemList.map(item=>initializeItem(item))],[])
const transitionSettings={minHeight:500,speed:250}
let currentPreview=null,scrollExtra=0,marginExpanded=10,windowSize={width:window.innerWidth,height:window.innerHeight}
const isCloseTriggeringElement=(element)=>["item-close"].reduce((acc,toCheck)=>acc|element.classList.contains(toCheck),false)
const isClassInElementTree=(element,classname,stopSearchAtClass)=>{if(stopSearchAtClass&&element.classList.contains(stopSearchAtClass))return false
if(!element.parentNode)return false;if(element.classList.contains(classname))return true;return isClassInElementTree(element.parentNode,classname,stopSearchAtClass);}
function initializeItem(item){item.data=computeInitialItemData(item)
item.addEventListener('click',function(event){let clickedItem=this
let target=event.toElement||event.target
let isPreviewElementClicked=isClassInElementTree(target,"item-expander","grid-container")
isCloseTriggeringElement(target)?hidePreview():currentPreview&&(currentPreview.item===clickedItem)&&!isPreviewElementClicked?hidePreview():!isPreviewElementClicked?showPreview(clickedItem):null})
return item}
function computeInitialItemData(item){regexURL=/\$[^$]*\$/g
regexMAP=/[^$|,]+/g
let urls=item.getAttribute("data-urlMap").match(regexURL)
let urlElements=urls?urls.map(d=>{let match=d.match(regexMAP)
let element=document.createElement('a')
element.setAttribute('class','urlMap')
element.setAttribute('target','_blank')
element.setAttribute('href',match[1])
element.innerText=decodeURIComponent(match[0])
return element}):[]
return{'height':item.offsetHeight,'offsetTop':item.offsetTop+item.offsetParent.offsetTop,'imgLarge':item.getAttribute('data-largeSrc'),'title':item.getAttribute('data-title'),'description':item.getAttribute('data-description'),'urls':urlElements}}
function updateItemData(item){item.data.offsetTop=item.offsetTop+item.offsetParent.offsetTop}
const showPreview=(clickedItem)=>{if(!currentPreview){currentPreview=new Preview(clickedItem)
currentPreview.open()}
else if(currentPreview.item&&isOnSameRow(clickedItem,currentPreview.item)){currentPreview.update(clickedItem)}else{if(clickedItem.data.offsetTop>currentPreview.item.data.offsetTop){scrollExtra=currentPreview.item.data.offsetTop;}
currentPreview.close()
currentPreview=new Preview(clickedItem)
currentPreview.open()}}
function hidePreview(){if(currentPreview){currentPreview.close()
currentPreview=null}}
function isOnSameRow(item,currentItem){return currentItem?item.data.offsetTop==currentItem.data.offsetTop:false}
class ImagePreloader{constructor(path){this.imgUrl=path}
preloadImage(){return new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=resolve;image.src=this.imgUrl;})}}
class Preview{constructor(item){this.item=item
this.itemParent=item
this.expandedIdx=gridItems.findIndex(d=>d==item)
this.create()
this.update()}
create(){this.title=document.createElement('h3')
this.description=document.createElement('p');this.details=document.createElement('div')
this.details.setAttribute('class','item-details')
this.details.append(this.title,this.description)
this.loading=document.createElement('div')
this.loading.setAttribute('class','item-loading')
this.fullImage=document.createElement('div')
this.fullImage.setAttribute('class','item-fullImg')
this.fullImage.append(this.loading);this.closePreview=document.createElement('span')
this.closePreview.setAttribute('class','item-close')
this.previewInner=document.createElement('div')
this.previewInner.setAttribute('class','item-expander-inner')
this.previewInner.append(this.closePreview,this.fullImage,this.details)
this.previewElement=document.createElement('div')
this.previewElement.setAttribute('class','item-expander')
this.previewElement.append(this.previewInner)
this.item.appendChild(this.getElement())}
getElement(){return this.previewElement}
update(newItem){if(newItem){this.item.classList.remove('item-expanded')
this.item=newItem}
this.item.classList.add('item-expanded')
this.title.innerText=this.item.data.title
this.description.innerText=this.item.data.description
document.querySelectorAll('.urlMap').forEach(e=>e.parentNode.removeChild(e))
this.details.append(...this.item.data.urls)
if(this.imageElement){this.fullImage.removeChild(this.imageElement)}
let image=new ImagePreloader(this.item.data.imgLarge)
image.preloadImage().then(resolve=>{this.imageElement=document.createElement('img')
this.imageElement.setAttribute('src',this.item.data.imgLarge)
this.fullImage.append(this.imageElement)})}
open(){this.calculateAndSetHeight();this.launchPreview();}
close(){let toShrinkItem=this.itemParent.style.height.match(/[0-9]+/g)[0]-this.previewElement.parentNode.data.height
let toShrinkPreview=+this.previewElement.style.height.match(/[0-9]+/g)[0]
let self=this
new Promise((resolve,reject)=>{animate({duration:transitionSettings.speed,timing:makeEaseOut(circ),draw:(progress)=>{self.itemParent.style.height=`${self.previewElement.parentNode.data.height+(toShrinkItem-progress*toShrinkItem)}px`
self.previewElement.style.height=`${toShrinkPreview-(progress*toShrinkPreview)}px`
if(progress==1)resolve(true)}})}).then(resolve=>{self.itemParent.removeChild(self.previewElement)
self.item.classList.remove('item-expanded')})}
calculateAndSetHeight(){let heightPreview=windowSize.height-this.item.data.height-marginExpanded,itemHeight=windowSize.height
if(heightPreview<transitionSettings.minHeight){heightPreview=transitionSettings.minHeight
itemHeight=transitionSettings.minHeight+this.item.data.height+marginExpanded}
this.height=heightPreview;this.itemHeight=itemHeight;}
launchPreview(){let position=this.item.data.offsetTop,previewOffsetT=this.item.offsetParent.offsetTop+this.previewElement.offsetTop-scrollExtra,targetScrollVal=this.height+this.item.data.height+marginExpanded<=windowSize.height?position:this.height<windowSize.height?previewOffsetT-(windowSize.height-this.height):previewOffsetT
const currentScrollTop=Math.max(html.scrollTop,body.scrollTop)
const toScroll=targetScrollVal-currentScrollTop
const toIncreaseHeightItem=this.itemHeight-this.item.data.height
let self=this
animate({duration:transitionSettings.speed,timing:makeEaseOut(circ),draw:progress=>{html.scrollTop=currentScrollTop+progress*toScroll
body.scrollTop=currentScrollTop+progress*toScroll
self.item.style.height=`${self.item.data.height+progress*toIncreaseHeightItem}px`
self.previewElement.style.height=`${progress*self.height}px`}})}
transferOwnershipTo(newItemParent){this.itemParent.style.height=`${this.itemParent.data.height}px`
this.itemParent.removeChild(this.previewElement)
this.itemParent=this.item
this.item.style.height=`${this.itemHeight}px`
this.item.appendChild(this.previewElement)}}
function animate({timing,draw,duration}){let start=performance.now();requestAnimationFrame(function animate(time){let timeFraction=(time-start)/duration;if(timeFraction>1)timeFraction=1;let progress=timing(timeFraction)
draw(progress);if(timeFraction<1){requestAnimationFrame(animate);}});}
function circ(timeFraction){if(timeFraction>1)timeFraction=1
return 1-Math.sin(Math.acos(timeFraction));}
function makeEaseOut(timing){return function(timeFraction){return 1-timing(1-timeFraction);}}
function updateItemsInfo(){gridItems.forEach(d=>updateItemData(d))}
function updateParams(){windowSize={width:window.innerWidth,height:window.innerHeight};scrollExtra=0;updateItemsInfo()}
const updateParamsSmartly=throttleAndDebounce(()=>{updateParams()
if(currentPreview){if(currentPreview.item.data.offsetTop!=currentPreview.itemParent.data.offsetTop){currentPreview.transferOwnershipTo(currentPreview.item)}}},200);window.addEventListener('resize',updateParamsSmartly);function throttleAndDebounce(func,wait){let delay=wait,throttled=false,lastExecution
return function(){let context=this,args=arguments;if(!throttled){func.apply(context,args)
throttled=true;setTimeout(()=>{throttled=false;},delay);}
let later=function(){func.apply(context,args);};clearTimeout(lastExecution);lastExecution=setTimeout(later,delay);};};