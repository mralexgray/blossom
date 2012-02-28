// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('surfaces/composite');

if (BLOSSOM) {

SC.ENTER_LEFT      = 'enter-left';
SC.SLIDE_FLIP_LEFT = 'slide-flip-left';
SC.EXIT_RIGHT      = 'exit-right';

/** @class
  `SC.ContainerSurface` implements a swappable surface container.  You can 
  set the container's `contentSurface` property to a surface, and the surface 
  will be sized and positioned according to the container's size and position.

  In addition, the surface will be animated into place using one of three 
  hardware-accellerated 3D transitions:

  - order in (defaults to SC.ENTER_LEFT)
  - replace (defaults to SC.SLIDE_FLIP_LEFT)
  - order out (defaults to SC.EXIT_RIGHT)

  You can change the transition to use, or set them to `null` to use no 
  transition at all.

  @extends SC.CompositeSurface
  @since Blossom 1.0
*/
SC.ContainerSurface = SC.CompositeSurface.extend({

  orderInTransition:  SC.ENTER_LEFT,
  replaceTransition:  SC.SLIDE_FLIP_LEFT,
  orderOutTransition: SC.EXIT_RIGHT,

  /** @property
    The surface displayed by this container.

    The surface's parent layout is relative to the container, and sized 
    based on its bounds.

    Animated, hardware-accelerated 3D transitions are available when changing 
    the surface.  There are three possible transitions:

    - order in (defaults to SC.ENTER_LEFT)
    - replace (defaults to SC.SLIDE_FLIP_LEFT)
    - order out (defaults to SC.EXIT_RIGHT)

    You can change the type of transition for each of these situations, and 
    that transition will be used whenever the `surface` property is changed.

    @type SC.Surface or null
  */
  contentSurface: null,

  _sc_contentSurface: null, // Required, we're strict about null checking.
  _sc_contentSurfaceDidChange: function() {
    console.log('SC.ContainerSurface#_sc_contentSurfaceDidChange()');
    var old = this._sc_contentSurface,
        cur = this.get('contentSurface'),
        transition, frame = this.get('frame');
        // element = this.__sc_element__,
        // container, style;

    sc_assert(old === null || old.kindOf(SC.Surface), "Blossom internal error: SC.Application^_sc_surface is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.Surface), "SC.ContainerSurface@surface must either be null or an SC.Surface instance.");

    if (old === cur) return; // Nothing to do.

    // HACK: Work around a WebKit bug where the screen is black on first load.
    if (SC.isExecutingMain) {
      setTimeout(function() {
        document.body.insertBefore(document.createElement('div'), null);
      }, 0);
    }

    this._sc_contentSurface = cur;

    if (cur) {
      cur.set('container', this);
      cur.setIfChanged('isPresentInViewport', this.get('isPresentInViewport'));
      cur.setIfChanged('applicationHasFocus', this.get('applicationHasFocus'));
    }

    // FIXME: This logic needs to be applied to surfaces, not the DOM!

    if (!old && cur)      transition = this.get('orderInTransition');
    else if (old && cur)  transition = this.get('replaceTransition');
    else if (old && !cur) transition = this.get('orderOutTransition');
    else sc_assert(false);
    
    // transition = null; // force no transition
    if (old) transition = null;
    if (transition) {
      
      // order in
      if (!old && cur) {
        console.log('ordering in');
        // container = cur.__sc_element__;
        // sc_assert(container);
        // sc_assert(!document.getElementById(container.id));
        //     
        // style = container.style;
        // style.display  = 'block';
        // style.position = 'absolute';
        // // style.top      = '0px';
        // // style.left     = '0px';
        // // style.width    = '100%';
        // // style.height   = '100%';
        // style.webkitBackfaceVisibility = 'hidden';
        // style.webkitTransform = 'rotateY(180deg)';
        //     
        // // The order is important here, otherwise the layers won't have the 
        // // correct size.
        // element.insertBefore(container, null); // add to DOM
        // sc_assert(document.getElementById(container.id));
        // element.style.opacity = '1';
        // element.style.webkitTransform = 'translateX(-100%) rotateY(-180deg)';
        // cur.didAttach();
        if (cur.__useContentSize__) {
          cur.__contentWidth__ = frame.width;
          cur.__contentHeight__ = frame.height;
          cur.triggerContentSizeUpdate();
        }
        this.get('subsurfaces').push(cur);
        cur.set('opacity', 1);
        var transform = SC.MakeIdentityTransform3D();
        transform = SC.Transform3DRotateY(transform, Math.PI);
        SC.AnimationTransaction.begin({ duration: 0 });
        cur.set('transform', transform);
        var transformOrigin = cur.get('transformOrigin');
        transformOrigin.x = 1.0;
        transformOrigin.y = 0.5;
        this.set('transformOrigin', transformOrigin);
        this.set('opacity', 0.0);
        SC.AnimationTransaction.end();
        var that = this;
        setTimeout(function() {
          console.log('running animation');
          SC.RunLoop.begin();
          var transform = SC.MakeIdentityTransform3D();
          transform = SC.Transform3DTranslateX(transform, frame.width);
          transform = SC.Transform3DRotateY(transform, -Math.PI);
          SC.AnimationTransaction.begin({ duration: 2000 });
          that.set('transform', transform);
          SC.AnimationTransaction.end();
          SC.AnimationTransaction.begin({ duration: 1000, delay: 1000 });
          that.set('opacity', 1.0);
          SC.AnimationTransaction.end();
          SC.RunLoop.end();
        }, 0);
      }
    
    // Update the UI without any 3D transition.
    } else {
    
      // order in
      if (!old && cur) {
        if (cur.__useContentSize__) {
          cur.__contentWidth__ = frame.width;
          cur.__contentHeight__ = frame.height;
          cur.triggerContentSizeUpdate();
        }
        this.get('subsurfaces').push(cur);
        // container = cur.__sc_element__;
        // sc_assert(container);
        // sc_assert(!document.getElementById(container.id));
        // 
        // style = container.style;
        // style.position = 'absolute';
        // style.top      = '0px';
        // style.left     = '0px';
        // style.width    = '100%';
        // style.height   = '100%';
        //     
        // // The order is important here, otherwise the layers won't have the 
        // // correct size.
        // element.insertBefore(container, null); // add to DOM
        // element.style.opacity = 1;
    
      // replace
      } else if (old && cur) {
        // container = cur.__sc_element__;
        // sc_assert(container);
        // sc_assert(!document.getElementById(container.id));
        // sc_assert(document.getElementById(old.__sc_element__.id));
        //     
        // style = container.style;
        // style.position = 'absolute';
        // style.top      = '0px';
        // style.left     = '0px';
        // style.width    = '100%';
        // style.height   = '100%';
        //     
        // // The order is important here, otherwise the layers won't have the 
        // // correct size.
        // element.replaceChild(container, old.__sc_element__);
    
      // order out
      } else if (old && !cur) {
        // sc_assert(document.getElementById(old.__sc_element__.id));
        //     
        // element.removeChild(old.__sc_element__);
        // element.style.opacity = 0;
      }
    }
  }.observes('contentSurface'),

  _sc_containerFrameDidChange: function() {
    // console.log('SC.ContainerSurface#_sc_containerFrameDidChange()');
    var frame = this.get('frame'),
        contentSurface = this.get('contentSurface');

    if (contentSurface) {
      contentSurface.set('frame', frame);
      if (contentSurface.__useContentSize__) {
        contentSurface.__contentWidth__ = frame.width;
        contentSurface.__contentHeight__ = frame.height;
        contentSurface.triggerContentSizeUpdate();
      }
    }
  }.observes('frame'),

  updateLayout: function() {
    // console.log('SC.ContainerSurface#updateLayout()');
    var contentSurface = this.get('contentSurface');
    if (contentSurface) contentSurface.updateLayout();
  },

  updateDisplay: function() {
    // console.log('SC.ContainerSurface#updateDisplay()');
    var contentSurface = this.get('contentSurface');
    if (contentSurface) contentSurface.updateDisplay();
  }

});

} // BLOSSOM
