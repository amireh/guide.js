(function(t,i){"use strict";if(!i)throw"guide.js: jQuery is undefined, are you sure it has been loaded yet?";var s=function(){return this.constructor.apply(this,arguments),this},e="with-gjs",n="gjs-with-overlay",o="gjs-without-overlay",r="gjs-hiding",a="gjs-entity",h={defaults:{},addOption:function(t,i){this.defaults[t]=i,this.options&&void 0===this.options[t]&&(this.options[t]=i)},setOptions:function(t){return this.options=this.getOptions(t),this.refresh&&this.refresh(this.options),this.$&&(console.log("guide.js:",this.id,"options changed, triggering refresh"),this.$.triggerHandler("refresh",[this.options,this])),this},getOptions:function(i){return t.extend(t.clone(this.options||{}),i||{})}};t.extend(s.prototype,h,{id:"guide",defaults:{withOverlay:!1,withAnimations:!0,toggleDuration:500},entityKlass:function(){return a},constructor:function(){this.$=i(this),t.extend(this,{$container:i("body"),$el:i('<div class="gjs" />'),options:t.clone(this.defaults),tours:[],extensions:[],tour:null}),this.$.on("refresh",function(t,i,s){s.toggleOverlayMode()}),console.log("guide.js: running")},inactiveTours:function(){return t.without(this.tours,this.tour)},defineTour:function(i,e){var n;if((n=this.getTour(i))||(n=new s.Tour(i),this.tours.push(n)),e){if(!t.isArray(e))throw"guide.js#defineTour: bad spots, expected array, got: "+typeof e;this.fromJSON(e)}return n},runTour:function(t){var i;if(this.isShown()||this.show(),!(i=this.getTour(t)))throw["guide.js: undefined tour '",t,"', did you forget to call #defineTour()?"].join("");return this.tour&&(this.tour.stop(),this.$.triggerHandler("stop.tours",[this.tour])),this.tour=i,this.$.triggerHandler("start.tours",[this.tour]),this.tour.start(),console.log('guide.js: touring "'+i.id+'"'),this},addSpot:function(i,s){var e=this.tour,n=s.tour;return n&&t.isString(n)?e=this.defineTour(n):n&&(e=n),e.addStep(i,s)},addSpots:function(t){return this.fromJSON(t)},fromJSON:function(i){return i=t.isArray(i)?i:[i],t.each(i,function(t){this.addSpot(t.$el,t)},this),this},fromDOM:function(t){var s=this,e=i(t);return e.find("[data-guide]").each(function(){var t=i(this);s.fromNode(t,{text:t.attr("data-guide")})}),e.find("[data-guide-spot]").each(function(){var t=i(this),e=i(t.attr("data-guide-spot"));s.fromNode(e,{text:t.detach()[0].outerHTML})}),this},fromNode:function(i,s){var e,n=i,s=t.extend(s||{},t.parseOptions(n.attr("data-guide-options")),{caption:n.attr("data-guide-caption"),tour:n.attr("data-guide-tour")});s.tour||(e=n.parents("[data-guide-tour]:first"),e.length&&(s.tour=e.attr("data-guide-tour"))),n.attr({"data-guide":null,"data-guide-options":null,"data-guide-caption":null}),this.addSpot(n,s)},show:function(){var t=(this.getOptions(),[e]);return this.tour||this.runTour(this.tours[0]),this.toggleOverlayMode(),this.$container.addClass(t.join(" ")),this.$.triggerHandler("show"),this.tour.start(),this.$el.appendTo(this.$container),this.options.withAnimations&&this.$el.show(this.options.toggleDuration),this},refresh:function(){return t.each(this.extensions,function(t){t.refresh&&t.refresh()}),this},hide:function(){var t=this,i=function(){t.$el.detach(),t.$container.removeClass([e,n,r].join(" ")),t.tour.stop(),t.$.triggerHandler("hide")};return this.$container.addClass(r),this.options.withAnimations?t.$el.hide(this.options.toggleDuration,i):i(),this},toggle:function(){return this.isShown()?this.hide.apply(this,arguments):this.show.apply(this,arguments)},toggleOverlayMode:function(t){t&&(this.options.withOverlay=!this.options.withOverlay),this.options.withOverlay?this.$container.addClass(n).removeClass(o):this.$container.removeClass(n).addClass(o)},isShown:function(){return this.$container.hasClass(e)},dismiss:function(){this.$.triggerHandler("dismiss")},focus:function(){return this.tour.focus.apply(this.tour,arguments)},addExtension:function(t){if(!t.id)throw"guide.js: bad extension, no #id attribute defined";if(this.extensions.push(t),void 0===t.__initExtension)throw"guide.js: bad extension, does not seem to implement the guide.Extension prototype";t.__initExtension(),console.log("guide.js: extension registered: ",t.id)},getExtension:function(i){return t.find(this.extensions,{id:i})},getTour:function(i){return t.isString(i)?t.find(this.tours||[],{id:i}):i}}),s=new s,s.Optionable=h,window.guide=s})(_,jQuery),function(t){for(var i=["assign","parseOptions"],s=0;i.length>s;++s){var e=i[s];if(void 0!==t[e])throw"guide.js: existing _."+e+" implementation!"}t.assign=function(t,i,s){var e=t.split("."),n=e.length;if(n>1){t=s;for(var o=0;n>o;++o){var r=e[o];if(t[r]=t[r]||{},o==n-1){t[r]=i;break}t=t[r]}}else s[t]=i};var n=/[:|,]/,o=RegExp(":\\s+","g");t.parseOptions=function(i,s){for(var s=s||{},e=s.separator||n,r=s.sanitizer||o,a=(i||"").replace(r,":").split(e),h=a.length,u={},d=0;h>d;++d){var c=(a[d]||"").trim(),l=(a[++d]||"").trim();c&&("false"==l?l=!1:"true"==l?l=!0:""+Number(l)==l&&(l=Number(l)),t.assign(c,l,u))}return u}}(_),function(t){for(var i=["consume","guide"],s=0;i.length>s;++s){var e=i[s];if(void 0!==t[e]||void 0!==t.fn[e])throw"guide.js: existing $."+e+" implementation!"}var n=t(window);t.extend(t.expr[":"],{in_viewport:function(i){var s=n.scrollTop(),e=s+n.height(),o=t(i).offset().top,r=o+t(i).height();return o>s&&e>r}}),t.consume=function(t){return t?(t.preventDefault&&t.preventDefault(),t.stopPropagation&&t.stopPropagation(),t.stopImmediatePropagation&&t.stopImmediatePropagation(),t.cancelBubble=!0,t.returnValue=!1,!1):!1},t.fn.guide=function(i){var i=i||{},s=window.guide;if(!s)throw"guide.js: bad $.fn.guide call, global guide has not been setup, have you forgotten to initialize guide.js?";return s.addSpot(t(this),i),t(this)}}($),function(t,i,s){"use strict";var e=t.extend({},s.Optionable,{__initExtension:function(){var i=this;if(this.id,!this.id)throw"guide.js: bad extension, missing #id";this.options=t.clone(this.defaults),s.$.on("show",function(){i.onGuideShow&&i.onGuideShow()}).on("hide",function(){i.onGuideHide&&i.onGuideHide()}).on("start.tours.gjs_extension",function(t,s){s.$.on("refresh.gjs_extension",function(){i.setOptions(i.getOptions())}),i.setOptions(i.getOptions()),i.onTourStart&&i.onTourStart(s)})},getOptions:function(i){var e=this.id;return t.extend({},this.options||this.defaults,e&&s.getOptions()[e],e&&s.tour?s.tour.getOptions()[e]:null,i)},isEnabled:function(){return!!this.getOptions().enabled}});s.Extension=e}(_,jQuery,window.guide),function(t,i,s){"use strict";var e=function(){return this.constructor.apply(this,arguments)};t.extend(e.prototype,s.Optionable,{defaults:{alwaysHighlight:!0},constructor:function(s){return this.$=i(this),t.extend(this,{id:s,options:t.extend({},this.defaults),spots:[],current:null,previous:null,cursor:-1}),console.log("guide.js: tour defined: ",this.id),this},addStep:function(t,i){var e;if(t.data("guideling"))throw console.log("guide.js: [error] element is already bound to a tour spot:"),console.log(t),"guide.js: duplicate spot, see console for more information";return e=new s.Spot({$el:t,$scrollAnchor:t,tour:this,index:this.spots.length},i),this.spots.push(e),t.addClass(s.entityKlass()).data("guideling",e),s.isShown()&&e.highlight(),s.$.triggerHandler("add",[e]),!0},next:function(){return this.hasNext()?this.focus(this.cursor+1):!1},hasNext:function(){var t=this.spots.length;return 1!=t&&t-1>this.cursor},prev:function(){return this.hasPrev()?this.focus(this.cursor-1):!1},hasPrev:function(){var t=this.spots.length;return 1!=t&&this.cursor>0},first:function(){return this.focus(0)},last:function(){return this.focus(this.spots.length-1)},focus:function(t){var i=this.getStep(t);if(!i)throw"guide.js: bad spot @ "+t+" to focus";return i.isCurrent()?!1:(this.isActive()||s.runTour(this),this.previous=this.current,this.current=i,this.cursor=i.index,this.previous&&(this.previous.defocus(i),s.$.triggerHandler("defocus",[this.previous,this.current,this])),s.$.triggerHandler("pre-focus",[i,this]),i.focus(this.previous),s.$.triggerHandler("focus",[i,this]),console.log("guide.js: visiting tour spot #",i.index),!0)},start:function(){return this.spots.length?(t.each(this.spots,function(t){t.highlight()}),this.focus(this.current||0),this):this},stop:function(){return t.each(this.spots,function(t){t.dehighlight({force:!0})}),this},isActive:function(){return s.isShown()&&this==s.tour},refresh:function(){this.isActive()&&this.stop().start()},getStep:function(i){var s=i;return"number"==typeof s?this.spots[s]:s?t.find(this.spots||[],s):null},indexOf:function(i){return t.indexOf(this.spots,i)}}),s.Tour=e,s.tour=s.defineTour("Default Tour")}(_,jQuery,window.guide),function(t,i,s){"use strict";var e=function(){return this.constructor.apply(this,arguments)},n="gjs-spot",o="gjs-spot-focused";t.extend(e.prototype,s.Optionable,{defaults:{withMarker:!0,highlight:!0,autoScroll:!0},constructor:function(i,s){return this.options=t.extend({},this.defaults,s),t.extend(this,{index:-1},i,t.pick(s,["text","caption"])),this},isCurrent:function(){return this.tour.current==this},getText:function(){return this.text},hasText:function(){return!!(this.getText()||"").length},getCaption:function(){return this.caption},hasCaption:function(){return!!(this.getCaption()||"").length},hasContent:function(){return this.hasText()||this.hasCaption()},highlight:function(){var t=this.tour.getOptions().alwaysHighlight||this.isCurrent();return this.options.highlight||(t=!1),this.$el.toggleClass("no-highlight",!t),this.$el.toggleClass(n,t),this},dehighlight:function(t){var i=(t||{}).force||!this.tour.getOptions().alwaysHighlight;return i&&this.$el.removeClass(n),this},focus:function(s){var e=this.$scrollAnchor;this.highlight(),this.$el.addClass(o).triggerHandler("focus.gjs",s),this.options.autoScroll&&!e.is(":in_viewport")&&t.defer(function(){i("html,body").animate({scrollTop:.9*e.offset().top},250)})},defocus:function(t){this.dehighlight(),this.$el.removeClass(o),this.$el.triggerHandler("defocus.gjs",t)},refresh:function(){this.dehighlight(),this.highlight(),this.isCurrent()&&(this.defocus(),this.focus())}}),s.Spot=e}(_,jQuery,window.guide),function(t,i,s){"use strict";var e=function(){return this.constructor()},n=t.template(["<div>",'<div class="navigation">','<button class="bwd"></button>',"<span></span>",'<button class="fwd"></button>',"</div>",'<div class="content"></div>',"</div>"].join("")),o=t.template(["<div>","<% if (spot.hasCaption()) { %>",'<h6 class="caption"><%= spot.getCaption() %></h6>',"<% } %>","<div><%= spot.getText() %></div>","</div>"].join(""),null,{variable:"spot"});t.extend(e.prototype,s.Extension,{id:"tutor",defaults:{enabled:!0,spanner:!1},constructor:function(){var e=this;return this.$container=s.$el,this.$el=i(n({})),this.$el.attr({id:"gjs_tutor","class":s.entityKlass()}),t.extend(this,{$content:this.$el.find("> .content"),$nav:this.$el.find("> .navigation"),$close_btn:this.$el.find("#gjs_close_tutor"),$bwd:this.$el.find(".bwd"),$fwd:this.$el.find(".fwd")}),s.$.on("show",t.bind(this.show,this)).on("hide",t.bind(this.hide,this)).on("dismiss",t.bind(this.remove,this)).on("focus",t.bind(this.focus,this)).on("start.tours",function(t,i){i.current&&e.focus(t,i.current,i)}),this.$close_btn.on("click",t.bind(s.hide,s)),this.$nav.on("click",".bwd",function(){s.tour.prev()}),this.$nav.on("click",".fwd",function(){s.tour.next()}),this},show:function(){return this.getOptions().enabled?(this.$el.appendTo(this.$container),this):this},hide:function(){return this.$el.detach(),this},remove:function(){this.$el.remove()},toggle:function(){return this.$el.parent().length?this.hide.apply(this,arguments):this.show.apply(this,arguments)},refresh:function(){var t=this.getOptions();return t.enabled?(this.$el.toggleClass("spanner",t.spanner),this.focus(null,s.tour.current,s.tour),void 0):this.hide()},focus:function(t,i,s){var e,n=s.previous&&s.previous.index>s.cursor;return i&&i.$el.is(":visible")?(this.show(),i!=this.spot?(this.$content.html(o(i)),e=this.$nav.find("span"),e.stop(!0,!0).animate({"text-indent":(n?"":"-")+"50px"},"fast",function(){e.html(s.cursor+1),e.css({"text-indent":(n?"-":"")+"50px"},"fast").animate({"text-indent":"0"},"fast")}),this.$bwd.toggleClass("disabled",!s.hasPrev()),this.$fwd.toggleClass("disabled",!s.hasNext()),this.spot=i,!0):void 0):this.hide()}}),s.addExtension(new e)}(_,jQuery,window.guide),function(t,i,s){"use strict";var e=function(){return this.constructor()},n=function(){return this.constructor.apply(this,arguments)},o=t.template(['<div class="gjs-marker">','<span class="index"><%= index +1 %></span>',"</div>"].join("")),r=t.template(['<div class="gjs-marker">','<span class="index"><%= index +1 %></span>','<div class="text"><%= text %></div>',"</div>"].join("")),a=t.template(['<div class="gjs-marker">','<span class="index"><%= index +1 %></span>','<h6 class="caption"><%= caption %></h6>','<div class="text"><%= text %></div>',"</div>"].join("")),h=1,u=2,d=3,c=1,l=2,p=3,f=4,g=5,m=6,v=7,$=8,w=function(t){switch(t.placement){case h:t.spot.$el.append(t.$el);break;case u:var i=t.position,e=i>=p&&g>=i?"after":"before";t.spot.$el[e](t.$el);break;case d:s.$el.append(t.$el)}return t},b=function(t,i){var s,e=0;switch(i){case l:case m:s="left",e=-1*(t.outerWidth()/2);break;case f:case $:s="top",e=-1*(t.outerHeight()/2)}t.css("margin-"+s,e)},x=function(t,i,s,e,n){var o,r=0;switch(s){case p:case f:case g:var a=parseInt(i.css("margin-right"));a>0&&(r=-1*a+e,o="left");break;case c:case $:case v:var a=parseInt(i.css("margin-left"));a>0&&(r=-1*(a-n),o="right")}return 0!=r&&t.css("margin-"+o,r),b(t,s)},k=function(t,i,s,e){var n=i.offset(),o=i.outerWidth(),r=i.outerHeight(),a=t.outerHeight(),h=t.outerWidth(),u=e||15;switch(s){case c:n.top-=a+u;break;case l:n.top-=a+u,n.left+=o/2-h/2;break;case p:n.top-=a+u,n.left+=o-h;break;case f:n.top+=r/2-a/2,n.left+=o+u;break;case g:n.top+=r+u,n.left+=o-h;break;case m:n.top+=r+u,n.left+=o/2-h/2;break;case v:n.top+=r+u;break;case $:n.top+=r/2-a/2,n.left-=h+u}t.offset(n)};t.extend(e.prototype,s.Extension,{id:"markers",defaults:{refreshFrequency:500},constructor:function(){return s.Tour.prototype.addOption("alwaysMark",!0),s.tour&&s.tour.addOption("alwaysMark",!0),this.$container=s.$el,s.$.on("add",t.bind(this.addMarker,this)).on("focus",function(t,i){i.marker&&i.marker.highlight()}).on("defocus",function(t,i){i.marker&&i.marker.dehighlight()}),this},addMarker:function(t,e){var o;return e.options.withMarker?(o=new n(e,this),o.$el.addClass(s.entityKlass()).on("click.gjs-markers",function(t){return e.tour.focus(e),i.consume(t)}),s.isShown()&&e.tour.isActive()?o.show():o.hide(),o):null},refresh:function(){var i=s.tour;s.isShown()&&(this.onGuideHide(),this.rebuildMarkers(i),t.each(i.spots,function(t){t.marker&&(t.tour.getOptions().alwaysMark?t.marker.show():!t.isCurrent()&&t.marker.hide())}),this.onGuideShow())},onGuideShow:function(){return i(window).on("resize.gjs_markers",t.throttle(t.bind(this.repositionMarkers,this),this.options.refreshFrequency)),this.onTourStart(s.tour)},onGuideHide:function(){return i(window).off("resize.gjs_markers"),this.onTourStop(s.tour)},onTourStart:function(i){var s=this;t.defer(function(){t.each(i.spots,function(t){t.marker&&t.marker.show()})}),i.$.on("refresh.gjs_markers",function(){s.refresh()})},onTourStop:function(i){t.each(i.spots,function(t){t.marker&&t.marker.hide()}),i.$.off("refresh.gjs_markers")},rebuildMarkers:function(i){var s=this;t.each(i.spots,function(t){t.marker&&(t.marker.remove(),s.addMarker(null,t))}),i.current&&i.current.marker&&i.current.marker.highlight()},repositionMarkers:function(){var i=s.tour;return i?(t.each(i.spots,function(t){t.marker&&t.marker.$el.place()}),!0):!0}}),t.extend(n.prototype,{defaults:{position:"right",placement:"inline",withText:!0,width:"auto"},constructor:function(e){var n;if(e.index,this.spot=e,this.options=t.extend({},this.options||this.defaults,s.getOptions().marker,e.tour.getOptions().marker,e.getOptions().marker),n=i(this.build(e)),n.place=i.proxy(this.place,this),n.addClass([this.options.placement+"-marker",this.options.position].join(" ")),t.extend(this,{$el:n,$index:n.find(".index"),$caption:n.find(".caption"),$text:n.find(".text")}),this.placement==u){var o=e.$el,r=i(o[0].outerHTML.replace(/(<\/?)\w+\s/,"$1div ")).html("").attr({id:null,"class":o[0].className.replace(/(gjs(\-?\w+)+)/g,"").trim(),style:null}).css({display:o.css("display"),position:"relative"});this.$container=r,r.insertBefore(o),o.appendTo(r),n.appendTo(r),this.margin_right=parseInt(n.css("margin-right")),this.margin_left=parseInt(n.css("margin-left"))}return e.marker=this,e.$scrollAnchor=this.$el,this},build:function(t){var i=o;switch(this.withText=this.options.withText&&t.hasContent(),this.min_width=this.options.width||this.defaults.width,this.options.placement){case"inline":this.placement=h;break;case"sibling":this.placement=u;break;case"overlay":this.placement=d;break;default:throw'guide-marker.js: bad placement "'+this.options.placement+'"'}switch(this.options.position){case"topleft":this.position=c;break;case"top":this.position=l;break;case"topright":this.position=p;break;case"right":this.position=f;break;case"bottomright":this.position=g;break;case"bottom":this.position=m;break;case"bottomleft":this.position=v;break;case"left":this.position=$;break;default:throw'guide-marker.js: bad position "'+this.options.position+'"'}return t.hasCaption()?i=a:t.hasText()&&(i=r),i({index:t.index,text:t.getText(),caption:t.getCaption()})},show:function(){this.$el.place()},hide:function(){this.spot.$el.removeClass(["gjs-spot-"+this.options.placement,"gjs-spot-"+this.options.position].join(" ")),this.$el.detach()},remove:function(){this.hide(),this.placement==u&&(this.$container.replaceWith(this.spot.$el),this.$container.remove()),this.$el.remove()},highlight:function(){this.$el.addClass("focused"),s.$.triggerHandler("marking.gjs_markers",[this]),this.withText&&(this.$text.show(),this.$caption.show(),this.$index.hide(),this.$el.css({width:this.min_width})),this.show(),s.$.triggerHandler("marked.gjs_markers",[this])},dehighlight:function(){this.$el.removeClass("focused"),s.$.triggerHandler("unmarking.gjs_markers",[this]),this.withText&&(this.$text.hide(),this.$caption.hide(),this.$index.show(),this.$el.css({width:"auto"}),this.$el.place()),this.spot.tour.getOptions().alwaysMark||this.hide(),s.$.triggerHandler("unmarked.gjs_markers",[this])},canShow:function(){var t=this.spot;return t.tour.getOptions().alwaysMark||t.isCurrent()?t.$el.length&&t.$el.is(":visible")?!0:!1:!1},place:function(){var t=this.spot.$el;return this.$el,this.canShow()?(w(this),t.addClass(["gjs-spot-"+this.options.placement,"gjs-spot-"+this.options.position].join(" ")),this.placement==h?b(this.$el,this.position):this.placement==u?x(this.$el,t,this.position,this.margin_left,this.margin_right):this.placement==d&&k(this.$el,t,this.position),void 0):this.hide()}}),s.addExtension(new e)}(_,jQuery,window.guide),function(t,i,s){"use strict";var e=function(){return this.constructor()},n=t.template(['<div id="gjs_toggler">',"<button></button>","</div>"].join(""));t.extend(e.prototype,s.Extension,{defaults:{enabled:!0},id:"toggler",constructor:function(){return s.getExtension("tutor"),this.options=t.defaults({},this.defaults),this.$container=s.$container,this.$el=i(n({})),this.$el.addClass(s.entityKlass()),this.$indicator=this.$el.find("button"),this.$el.on("click",".show",t.bind(s.show,s)),this.$el.on("click",".hide",t.bind(s.hide,s)),s.$.on("show hide",t.bind(this.update,this)).on("dismiss",t.bind(this.remove,this)),this.show(),this},show:function(){return this.$el.appendTo(this.$container),this},hide:function(){return this.$el.detach(),this},remove:function(){this.$el.remove()},update:function(){s.isShown()?this.$indicator.text("Stop Tour").removeClass("show").addClass("hide"):this.$indicator.text("Tour").removeClass("hide").addClass("show"),this.$el.toggleClass("collapsed",!s.isShown())},refresh:function(t){var t=t||this.options;t.enabled?this.show():this.hide()}}),s.addExtension(new e)}(_,jQuery,window.guide),function(t,i,s){"use strict";var e=function(){return this.constructor()},n=t.template(['<div id="gjs_controls">','<button data-action="tour.first">First</button>','<button data-action="tour.prev">&lt;</button>','<button data-action="tour.next">&gt;</button>','<button data-action="tour.last">Last</button>','<button data-action="guide.hide">Close</button>',"</div>"].join("")),o=t.template(['<div class="developer-controls">','<button data-action="guide.toggle">Toggle</button>','<button data-action="toggleOverlay">Toggle Overlay</button>',"</div>"].join(""));t.extend(e.prototype,s.Extension,{defaults:{withDeveloperControls:!1,inMarkers:!0,inTutor:!0},id:"controls",constructor:function(){var i=this;return this.$container=s.$el,this.guide=s,this.tour=s.tour,this.options=t.defaults({},this.defaults),this.refresh(),s.$.on("show",t.bind(this.show,this)).on("hide",t.bind(this.hide,this)).on("dismiss",t.bind(this.remove,this)).on("focus",function(){i.refreshControls()}),this},onTourStart:function(t){this.tour=t,this.refreshControls()},show:function(){return this.$el.appendTo(this.$container),this.refreshControls(),this},hide:function(){return this.$el.detach(),this},remove:function(){this.$el&&(this.$el.remove(),s.$.off("marking.gjs_markers.embedded_controls").off("unmarking.gjs_markers.embedded_controls"))},attachToMarker:function(t){this.$container=t.$el,this.$container.addClass("with-controls"),this.show()},detachFromMarker:function(){this.$container.removeClass("with-controls"),this.$container=i(),this.hide()},refresh:function(){var e=s.getExtension("tutor"),r=s.getExtension("markers"),a=this.getOptions();this.remove(),r&&r.isEnabled()&&a.inMarkers?this.markerMode(r):e&&e.isEnabled()&&a.inTutor?this.tutorMode(e):this.classicMode(),this.$el=i(n({})),a.withDeveloperControls&&this.$el.append(i(o({}))),this.$el.addClass(s.entityKlass()).on("click","[data-action]",t.bind(this.delegate,this)),t.extend(this,{$bwd:this.$el.find("[data-action*=prev]"),$fwd:this.$el.find("[data-action*=next]"),$first:this.$el.find("[data-action*=first]"),$last:this.$el.find("[data-action*=last]"),$hide:this.$el.find("[data-action*=hide]")}),this.show()},classicMode:function(){var t=s.getExtension("tutor"),i=s.getExtension("markers");this.$container=s.$el,t&&t.$el.addClass("without-controls").removeClass("with-controls"),i&&s.$.off("marking.gjs_markers.gjs_controls").off("unmarking.gjs_markers.gjs_controls")},markerMode:function(){var e=this;if(this.$container=i(),s.$.on("marking.gjs_markers.gjs_controls",function(t,i){e.attachToMarker(i)}).on("unmarking.gjs_markers.gjs_controls",function(t,i){e.detachFromMarker(i)}),s.tour&&s.tour.current&&s.tour.current.marker){var n=s.tour.current.marker;t.defer(function(){n.hide(),e.attachToMarker(n),n.show()})}},tutorMode:function(t){this.$container=t.$el,t.$el.addClass("with-controls")},delegate:function(t){var s=i(t.target).attr("data-action");if(s.indexOf(".")>-1){var e=s.split("."),n=e[0],o=e[1];this[n]&&this[n][o]&&this[n][o]()}else this[s]&&this[s]();return i.consume(t)},toggleOverlay:function(){s.setOptions({withOverlay:!s.options.withOverlay})},refreshControls:function(){this.$bwd.prop("disabled",!s.tour.hasPrev()),this.$fwd.prop("disabled",!s.tour.hasNext()),this.$first.prop("disabled",!s.tour.hasPrev()),this.$last.prop("disabled",!s.tour.hasNext()),this.$hide.toggle(!s.tour.hasNext())}}),s.addExtension(new e)}(_,jQuery,window.guide);