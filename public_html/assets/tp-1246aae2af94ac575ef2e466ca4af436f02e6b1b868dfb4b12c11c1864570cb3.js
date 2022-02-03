jQuery.fn.extend({
  accessibleToggle: function (accessibleToggleOptions = {}) {
    return this.each(function () {
      var
        $toggle = $(this),
        options = $.extend({
          hidingAnimation: false,
          showingAnimation: false
        }, $toggle.data(), accessibleToggleOptions),
        $control,
        $parent;

      try {
        $control = $(options.control);
      } catch (e) {
        if (options.control.charAt(0) === '#') {
          $control = $(document.getElementById(options.control.substr(1)));
        }
      }

      try {
        $parent = $(options.parent).first()
      } catch (e) {
        if (options.parent.charAt(0) === '#') {
          $parent = $(document.getElementById(options.parent.substr(1)));
        }
      }

      function hide (event = null, extraParameters = {}) {
        var ariaLabelledby = '';

        // block while hiding
        if (!$toggle.hasClass('hiding')) {
          $toggle
            .addClass('hiding')
            .animateCss(options.hidingAnimation)
            .trigger('accessibleToggle:hiding');

          $control.addClass('hiding-toggle');

          try {
            // update all controls
            ariaLabelledby = $($toggle.attr('aria-labelledby').split(' ').map(function (id) {
                return document.getElementById(id);
              }))
              .removeClass('shown-toggle')
              .addClass('hidden-toggle')
              .attr('aria-expanded', false)
              .toArray().reduce(function (ariaLabelledby, el) {
                return ariaLabelledby + ' ' + el.getAttribute('id');
              }, '');
          } catch (ignore) {}

          // remove controls that are no longer on the page
          $toggle.attr('aria-labelledby', ariaLabelledby.trim());

          if ($toggle.hasEvent('animationend')) {
            // if there's an animation, let it complete before hiding
            $toggle.one('animationend', hideToggle);
          } else {
            hideToggle();
          }

          if (extraParameters.stopPropagation === true) {
            event.stopPropagation();
          }
        }
      }

      function hideToggle () {
        $control.removeClass('hiding-toggle');

        $toggle
          .prop('hidden', true)
          .removeClass('hiding')
          .trigger('accessibleToggle:hidden');
      }

      function show (event = null, extraParameters = {}) {
        var ariaLabelledby = '';

        // block while showing
        if (!$toggle.hasClass('showing')) {
          $toggle
            .addClass('showing')
            .animateCss(options.showingAnimation)
            .trigger('accessibleToggle:showing');

          $control.addClass('showing-toggle');

          try {

            // if a parent is defined, hide all other toggles in it
            $($parent.data('accessible-toggle-children'))
              .filter(':visible')
              .not($toggle)
                .trigger('accessibleToggle:hide.baseline', { stopPropagation: true });
          } catch (ignore) {}

          try {
            // update all controls
            ariaLabelledby = $($toggle.attr('aria-labelledby').split(' ').map(function (id) {
                return document.getElementById(id);
              }))
              .removeClass('hidden-toggle')
              .addClass('shown-toggle')
              .attr('aria-expanded', true)
              .toArray().reduce(function (ariaLabelledby, el) {
                return ariaLabelledby + ' ' + el.getAttribute('id');
              }, '');
          } catch (ignore) {}

          // remove controls that are no longer on the page
          $toggle
            .attr('aria-labelledby', ariaLabelledby.trim())
            .prop('hidden', false);

          if ($toggle.hasEvent('animationend')) {
            // if there's an animation, let it complete before triggering the shown event
            $toggle.one('animationend', showToggle);
          } else {
            showToggle();
          }

          if (extraParameters.stopPropagation === true) {
            event.stopPropagation();
          }
        }
      }

      function showToggle () {
        $control.removeClass('showing-toggle');

        $toggle
          .removeClass('showing')
          .trigger('accessibleToggle:shown');
      }

      function toggleClick (event) {
        $toggle.is(':visible') ? hide(event) : show(event);
      }

      $toggle
        .id('accessible_toggle')
        .addClass('accessible-toggle');

      $control
        .id('accessible_toggle_control')
        .addClass('accessible-toggle-control')
        .attr('aria-controls', function (index, attr) {
          try {
            attr = attr.split(' ')
          } catch (e) {
            attr = [];
          }

          if (attr.indexOf($toggle.attr('id')) < 0) {
            attr.push($toggle.attr('id'));
          }

          return attr.join(' ').trim();
        })
        .prop('disabled', false)
        .not('a[href], link[href], button, input, select, textarea')
          .attr('tabindex', 0);

      $parent
        .data('accessible-toggle-children', ($parent.data('accessible-toggle-children') || []).concat(this));

      $toggle
        .attr('aria-labelledby', function (index, attr) {
          try {
            attr = attr.split(' ')
          } catch (e) {
            attr = [];
          }

          $control.each(function () {
            var controlID = $(this).attr('id');

            if (attr.indexOf(controlID) < 0) {
              attr.push(controlID);
            }
          });

          return attr.join(' ').trim();
        });

      // check the toggle for show/hide events
      if (!$toggle.hasEventHandler('accessibleToggle:hide.baseline', hide) ||
          !$toggle.hasEventHandler('accessibleToggle:show.baseline', show) ) {
        $toggle
          .on('accessibleToggle:hide.baseline', hide)
          .on('accessibleToggle:show.baseline', show);

        $(window)
          .on('resize', function () {
            var hidden = options.hidden === undefined ? $toggle.is(':hidden') : eval(options.hidden);

            $toggle
              .prop('hidden', hidden);

            $control
              .removeClass('shown-toggle hidden-toggle')
              .addClass(hidden ? 'hidden-toggle' : 'shown-toggle')
              .attr('aria-expanded', !hidden);
          })
          .trigger('resize');
      }

      // check the control for click events
      if (!$control.hasEventHandler('click', toggleClick)) {
        $control
          .on('click', toggleClick)
          .not('button, [type="button"], [type="image"], [type="reset"], [type="submit"]')
            .on('keypress', function (event) {
              if (event.key === 'Enter') {
                toggleClick(event);
              }
            });
      }
    });
  }
});
jQuery.extend(jQuery.expr.pseudos, {
  'all-focusable': function (el) {
    var
      $el = $(el),
      hasTabindex = $el.attr('tabindex') !== undefined && +$el.attr('tabindex') > -1,
      map,
      mapName,
      nodeName = el.nodeName.toLowerCase(),
      returnValue = false;

    if ('a' === nodeName ) {
      returnValue = el.href || hasTabindex;
    } else if ('area' === nodeName) {
      map = el.parentNode;
      mapName = map.name;

      if (el.href && mapName && map.nodeName.toLowerCase() === 'map') {
        returnValue = $("img[usemap='#" + mapName + "']")[0];
      }
    } else if (/^(button|input|object|select|textarea)$/.test(nodeName)) {
      returnValue = true;
    } else {
      returnValue = hasTabindex;
    }

    return returnValue;
	}
});
window.animateClasses = ['bounce', 'flash', 'pulse', 'rubberBand', 'shake', 'swing', 'tada', 'wobble', 'jello', 'bounceIn', 'bounceInDown', 'bounceInLeft', 'bounceInRight', 'bounceInUp', 'bounceOut', 'bounceOutDown', 'bounceOutLeft', 'bounceOutRight', 'bounceOutUp', 'fadeIn', 'fadeInDown', 'fadeInDownBig', 'fadeInLeft', 'fadeInLeftBig', 'fadeInRight', 'fadeInRightBig', 'fadeInUp', 'fadeInUpBig', 'fadeOut', 'fadeOutDown', 'fadeOutDownBig', 'fadeOutLeft', 'fadeOutLeftBig', 'fadeOutRight', 'fadeOutRightBig', 'fadeOutUp', 'fadeOutUpBig', 'flip', 'flipInX', 'flipInY', 'flipOutX', 'flipOutY', 'lightSpeedIn', 'lightSpeedOut', 'rotateIn', 'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight', 'rotateOut', 'rotateOutDownLeft', 'rotateOutDownRight', 'rotateOutUpLeft', 'rotateOutUpRight', 'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight', 'slideOutUp', 'slideOutDown', 'slideOutLeft', 'slideOutRight', 'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp', 'zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp', 'hinge', 'jackInTheBox', 'rollIn', 'rollOut']

jQuery.fn.extend({
  animateCss: function (animationClass) {
    if (window.animateClasses.indexOf(animationClass) < 0) {
      return this;
    } else {
      animationClass += ' animated';

      return this.each(function () {
        var $el = $(this);

        $el
          .addClass(animationClass)
          .one('animationend', function () {
            $el.removeClass(animationClass);
          });
      });
    }
  }
});
jQuery.extend(jQuery.expr.pseudos, {
  focusable: function (el) {
    var
      $el = $(el),
      fieldset,
      hasTabindex = $el.attr('tabindex') !== undefined && +$el.attr('tabindex') > -1,
      map,
      mapName,
      nodeName = el.nodeName.toLowerCase(),
      returnValue = false;

    function visible ($el) {
      var visibility = $el.css('visibility');

      while (visibility === 'inherit') {
        $el = $el.parent();

        visibility = $el.css('visibility');
      }
      return visibility !== 'hidden';
    }

    if ('a' === nodeName ) {
      returnValue = el.href || hasTabindex;
    } else if ('area' === nodeName) {
      map = el.parentNode;
      mapName = map.name;

      if (el.href && mapName && map.nodeName.toLowerCase() === 'map') {
        returnValue = $("img[usemap='#" + mapName + "']")[0];
      }
    } else if (/^(button|input|object|select|textarea)$/.test(nodeName)) {
      returnValue = !el.disabled;

      if (returnValue) {
        fieldset = $el.closest('fieldset')[0];

        if (fieldset && !$el.closest('legend')[0]) {
          returnValue = !fieldset.disabled;
        }
      }
    } else {
      returnValue = hasTabindex;
    }

    return returnValue && $el.is(':visible') && visible($el);
	}
});
jQuery.fn.extend({
  hasEvent: function (event) {
    var namespace = '';

    event = event.split('.');

    if (event.length > 1) {
      namespace = event.pop();
      event = event.join('.');
    } else {
      event = event.pop();
    }

    try {
      return !!$._data(this[0], 'events')[event].find(function (delegate) {
        return (namespace === '' || namespace === delegate.namespace);
      });
    } catch (e) {
      return false;
    }
  }
});
jQuery.fn.extend({
  hasEventHandler: function (event, _function) {
    try {
      return this.hasEvent(event) &&
             !!$._data(this[0], 'events')[event.replace(/\.[^.]+$/, '')].find(function (delegate) {
               return _function.toString() === delegate.handler.toString();
             });
    } catch (e) {
      return false;
    }
  }
});
jQuery.fn.extend({
  id: function (prepend = 'baseline') {
    return this.each(function () {
      if (typeof this.id !== 'string' || this.id === '') {
        this.id = _.uniqueId('' + prepend + '_');
      }
    });
  }
});
jQuery.fn.extend({
  modal: function (modalOptions = {}) {
    return this.each(function () {
      var
        $modal = $(this),
        options = $.extend({
          closingAnimation: false,
          open: true,
          openingAnimation: false,
          parent: 'body > div:first-of-type'
        }, $modal.data(), modalOptions),
        $control,
        $parent;

      try {
        $control = $(options.control);
      } catch (e) {
        if (options.control.charAt(0) === '#') {
          $control = $(document.getElementById(options.control.substr(1)));
        }
      }

      try {
        $parent = $(options.parent).first()
      } catch (e) {
        if (options.parent.charAt(0) === '#') {
          $parent = $(document.getElementById(options.parent.substr(1)));
        }
      }

      // if no div is present, use the body
      if (!$parent.length) {
        $parent = $('body');
      }

      function close (event) {
        var ariaLabelledby = '';

        // block while closing
        if (!$modal.hasClass('closing')) {
          $modal
            .addClass('closing')
            .trigger('modal:closing');

          $control.addClass('closing-toggle');

          // add an animation if this isn't the intial close and the modal is opened
          if (event !== undefined && $modal.is(':visible') && options.closingAnimation) {
            $modal.animateCss(options.closingAnimation);
          }

          $(document)
            .off('click', closeOnClick)
            .off('keydown', closeOnEsc);

          try {
            // update all controls
            ariaLabelledby = $($modal.attr('aria-labelledby').split(' ').map(function (id) {
                return document.getElementById(id);
              }))
              .removeClass('opened')
              .addClass('closed')
              .attr('aria-expanded', false)
              .toArray().reduce(function (ariaLabelledby, el) {
                return ariaLabelledby + ' ' + el.getAttribute('id');
              }, '');
          } catch (ignore) {}

          // remove controls that are no longer on the page
          $modal.attr('aria-labelledby', ariaLabelledby.trim());

          if ($modal.hasEvent('animationend')) {
            // if there's an animation, let it complete before hiding the modal
            $modal.one('animationend', closeModal);
          } else {
            closeModal();
          }
        }
      }

      function closeModal () {
        $modal.prop('hidden', true);

        // allow focus again on non-modal elements
        $('[data-tabindex]')
          .each(function () {
            var $el = $(this);

            $el
              .attr('tabindex', eval($el.attr('data-tabindex')))
              .attr('data-tabindex', null);
          });

        $parent.removeClass('modal-overlay');

        $($modal.data('last-focus')).focus();

        $control.removeClass('closing-toggle');

        $modal
          .removeClass('closing')
          .trigger('modal:closed');
      }

      function closeOnEsc (event) {
        if (event.key === 'Escape') {
          close(event);
        }
      }

      function closeOnClick (event) {
        var $target = $(event.target);

        // close if the target isn't a child of the modal, or if its a close button
        if ($target.hasClass('close') || !$target.parent().closest($modal).length && !$target.is($control)) {
          close(event);

          // don't follow links
          event.preventDefault();
        }
      }

      function open (event) {
        var
          $document = $(document),
          ariaLabelledby = '';

        // block while opening
        if (!$modal.hasClass('opening')) {
          $modal
            .addClass('opening')
            .trigger('modal:opening');

          $control.addClass('opening-toggle');

          // add an animation if this isn't the intial open and the modal is closed
          if (event !== undefined && $modal.is(':hidden') && options.openingAnimation) {
            $modal.animateCss(options.openingAnimation);
          }

          if (!$document.hasEventHandler('click', closeOnClick)) {
            $document.on('click', closeOnClick);
          }

          if (!$document.hasEventHandler('keydown', closeOnEsc)) {
            $document.on('keydown', closeOnEsc);
          }

          try {
            // update all controls
            ariaLabelledby = $($modal.attr('aria-labelledby').split(' ').map(function (id) {
                return document.getElementById(id);
              }))
              .removeClass('closed')
              .addClass('opened')
              .attr('aria-expanded', true)
              .toArray().reduce(function (ariaLabelledby, el) {
                return ariaLabelledby + ' ' + el.getAttribute('id');
              }, '');
          } catch (ignore) {}

          // remove controls that are no longer on the page
          $modal.attr('aria-labelledby', ariaLabelledby.trim());

          $modal.data('last-focus', document.activeElement);

          $parent.addClass('modal-overlay');

          // remove focus on non-modal elements
          $(':all-focusable')
            .not($(':all-focusable', $modal))
            .not('[tabindex^=-]')
            .each(function () {
              var $el = $(this);

              $el
                .attr('data-tabindex', $el.attr('tabindex') || 'null')
                .attr('tabindex', '-1');
            });

          $modal.prop('hidden', false);

          if ($modal.hasEvent('animationend')) {
            // if there's an animation, let it complete before focusing and scrolling
            $modal.one('animationend', openModal);
          } else {
            openModal()
          }
        }
      }

      function openModal () {
        $modal.find(':focusable').first().focus()

        $modal.find('.modal-body').scrollTop(0);

        $control.removeClass('opening-toggle');

        $modal
          .removeClass('opening')
          .trigger('modal:opened');
      }

      $modal
        .id('modal')
        .addClass('modal');

      $control
        .id('modal_control')
        .addClass('modal-control')
        .attr('aria-controls', function (index, attr) {
          try {
            attr = attr.split(' ')
          } catch (e) {
            attr = [];
          }

          if (attr.indexOf($modal.attr('id')) < 0) {
            attr.push($modal.attr('id'));
          }

          return attr.join(' ').trim();
        })
        .prop('disabled', false);

      $modal
        .attr('aria-labelledby', function (index, attr) {
          try {
            attr = attr.split(' ')
          } catch (e) {
            attr = [];
          }

          $control.each(function () {
            var controlID = $(this).attr('id');

            if (attr.indexOf(controlID) < 0) {
              attr.push(controlID);
            }
          });

          return attr.join(' ').trim();
        });

      // check the modal for open/close events
      if (!$modal.hasEventHandler('modal:close.baseline', close) ||
          !$modal.hasEventHandler('modal:open.baseline', open)) {
        $modal
          .on('modal:close.baseline', close)
          .on('modal:open.baseline', open)
          .appendTo($parent);
      }

      // check the control for click events
      if (!$control.hasEventHandler('click', open)) {
        $control
          .on('click', open)
          .not('button, [type="button"], [type="image"], [type="reset"], [type="submit"]')
            .on('keypress', function (event) {
              if (event.key === 'Enter') {
                open(event);
              }
            });
      }

      if (options.open) {
        open();
      } else {
        close();
      }
    });
  }
});
jQuery.fn.extend({
  slideshow: function (slideshowOptions = {}) {
    return this.each(function () {
      var
        $slideshow = $(this).wrapInner('<div class="slides">'),
        $slides = $slideshow.children().children(),
        $paginator = $('<div class="paginator">'),
        options = $.extend({
          activeSlide: 0,
          entranceAnimation: 'slideInRight',
          exitAnimation: 'slideOutLeft',
          interval: 3000,
          keyboard: true,
          pager: true,
          paginator: true,
          reverse: false,
          wrap: true
        }, $slideshow.data(), slideshowOptions);

      // create the pager and paginator buttons
      $paginator.append(
        $slides.toArray().map(function (slide, index) {
          // make a paginator button for each slide
          return $('<button>')
            .append(
              $('<span class="sr-only">')
                .text('Show Slide ' + (index + 1))
            )
            .on('click', function (event) {
              $slideshow.trigger('slideshow:slide.baseline', index);
            });
        })
      );

      // append the paginator
      if (options.paginator) {
        $slideshow.prepend($paginator);
      }

      // append the pager
      if (options.pager) {
        $slideshow.prepend(
          $('<div class="pager">')
            .append(
              $('<button class="previous">')
                .append(
                  $('<span class="sr-only">')
                    .text('Show Previous Slide')
                )
                .on('click', function () {
                  $slideshow.trigger('slideshow:previous.baseline');
                }),
              $('<button class="next">')
                .append(
                  $('<span class="sr-only">')
                    .text('Show Next Slide')
                )
                .on('click', function () {
                  $slideshow.trigger('slideshow:next.baseline');
                })
            )
        );
      }

      $slideshow
        // pause when slideshow has focus/hover/touch
        .on('mouseenter', function () {
          $slideshow.addClass('hovered');
        })
        .on('focusin mouseenter touchstart slideshow:pause.baseline', function () {
          $slideshow.addClass('paused');
        })
        .on('mouseleave', function () {
          $slideshow.removeClass('hovered');
        })
        // unpause when slideshow doesn't have focus/hover
        .on('focusout mouseleave touchend slideshow:resume.baseline', function () {
          if ($slideshow.find(document.activeElement).length < 1 &&
              !$slideshow.hasClass('hovered')) {
            $slideshow.removeClass('paused');
          }
        })
        // show the slide after the active one, wrapping
        .on('keydown slideshow:next.baseline', function (event) {
          var index = $slides.filter('.active').index();

          if (event.key === undefined || options.keyboard && event.key === 'ArrowRight') {
            $slideshow.trigger('slideshow:slide.baseline', (index === $slides.length - 1) ? 0 : index + 1);
          }
        })
        // show the slide before the active one, wrapping
        .on('keydown slideshow:previous.baseline', function (event) {
          var index = $slides.filter('.active').index();

          if (event.key === undefined || options.keyboard && event.key === 'ArrowLeft') {
            $slideshow.trigger('slideshow:slide.baseline', (index === 0) ? $slides.length - 1 : index - 1);
          }
        })
        // show the slide with the given index
        .on('slideshow:slide.baseline', function (event, data = 0) {
          // convert data to an object if one wasn't passed
          data = $.extend({
            animate: true,
            slide: (typeof data === 'number') ? data : data.slide
          }, data);

          var
            $fromSlide = $slides.filter('.active'),
            $toSlide = $slides.eq(+data.slide),
            extraParameters = {
              $fromSlide: $fromSlide,
              $toSlide: $toSlide,
              fromIndex: $fromSlide.index(),
              toIndex: +data.slide
            };

          function onEntranceAnimationEnd () {
            // if the exiting slide had focus, give it to the entering slide
            if ($fromSlide.is(':focus') || $fromSlide.find(':focus').length > 0) {
              if ($toSlide.is(':focusable')) {
                $toSlide.first().focus();
              } else {
                $toSlide.find(':focusable').first().focus();
              }
            }

            $toSlide.removeClass('entering');
            $slideshow
              .removeClass('sliding')
              .trigger('slideshow:slid', extraParameters);
          }

          function onExitAnimationEnd () {
            $fromSlide.removeClass('active exiting');
          }

          // block while sliding
          if (!$slideshow.hasClass('sliding')) {
            $slideshow
              .addClass('sliding')
              .trigger('slideshow:sliding', extraParameters);

            // hide the current slide
            if (data.animate && options.exitAnimation) {
              $fromSlide
                .addClass('exiting')
                .animateCss(options.exitAnimation)
                .one('animationend', onExitAnimationEnd);
            } else {
              onExitAnimationEnd();
            }

            // update the paginator immediately, regardless of animation
            $paginator.children().eq(extraParameters.fromIndex)
              .removeClass('active')
              .prop('disabled', false);

            // show the next slide and update the paginator
            $paginator.children().eq(extraParameters.toIndex)
              .prop('disabled', true)
              .add($toSlide.addClass('entering'))
                .addClass('active');

            // set focus and trigger the slid event
            if (data.animate && options.entranceAnimation) {
              $toSlide
                .animateCss(options.entranceAnimation)
                .one('animationend', onEntranceAnimationEnd);
            } else {
              onEntranceAnimationEnd();
            }
          }
        })
        // show the active slide on page load
        .trigger(
          'slideshow:slide.baseline',
          { animate: false,
            slide: options.activeSlide }
        );

      // start the slideshow
      if (options.interval) {
        options.intervalID = setInterval(function () {
          // don't do anything if the slideshow's paused
          if (!$slideshow.is('.paused')) {
            // stop the interval after one iteration if no-wrap is declared
            if (options.afterFirstInterval && !options.wrap && $slides.filter('.active').index() === +options.activeSlide) {
              clearInterval(options.intervalID);
            // don't change keyboard focus on the user when changing slides
            } else if (options.reverse) {
              $slideshow.trigger('slideshow:previous.baseline')
            } else {
              $slideshow.trigger('slideshow:next.baseline');
            }

            options.afterFirstInterval = true;
          }
        }, options.interval);
      }
    });
  }
});
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    },
    configurable: true,
    writable: true
  });
}
;
// Production steps of ECMA-262, Edition 5, 15.4.4.21
// Reference: http://es5.github.io/#x15.4.4.21
// https://tc39.github.io/ecma262/#sec-array.prototype.reduce
if (!Array.prototype.reduce) {
  Object.defineProperty(Array.prototype, 'reduce', {
    value: function(callback /*, initialValue*/) {
      if (this === null) {
        throw new TypeError( 'Array.prototype.reduce ' +
          'called on null or undefined' );
      }
      if (typeof callback !== 'function') {
        throw new TypeError( callback +
          ' is not a function');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // Steps 3, 4, 5, 6, 7
      var k = 0;
      var value;

      if (arguments.length >= 2) {
        value = arguments[1];
      } else {
        while (k < len && !(k in o)) {
          k++;
        }

        // 3. If len is 0 and initialValue is not present,
        //    throw a TypeError exception.
        if (k >= len) {
          throw new TypeError( 'Reduce of empty array ' +
            'with no initial value' );
        }
        value = o[k++];
      }

      // 8. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kPresent be ? HasProperty(O, Pk).
        // c. If kPresent is true, then
        //    i.  Let kValue be ? Get(O, Pk).
        //    ii. Let accumulator be ? Call(
        //          callbackfn, undefined,
        //          « accumulator, kValue, k, O »).
        if (k in o) {
          value = callback(value, o[k], k, o);
        }

        // d. Increase k by 1.
        k++;
      }

      // 9. Return accumulator.
      return value;
    }
  });
}
;

$(function () {
  $('body.no-js')
    .toggleClass('js no-js');

  $('a[href^="mailto:"]')
    .each(function () {
      var $a = $(this);

      $a
        .attr(
          'href',
          $a.attr('href')
            .replace(/\s*\[at\]\s*/ig, '@')
            .replace(/\s*\[dot\]\s*/ig, '.')
        )
        .html(
          $a.html()
            .replace(/\s*\[at\]\s*/ig, '@')
            .replace(/\s*\[dot\]\s*/ig, '.')
        );
    });
});
jQuery.fn.extend({
  zebraStripe: function () {
    return this.each(function () {
      var
        $tbody = $(this),
        cols = $tbody.siblings('colgroup').children('col').length,
        stripe = false;

      $('> tr', $tbody).each(function () {
        var
          $tr = $(this),
          cells = 0;

        $('> th, > td', $tr).each(function () {
          cells += +this.getAttribute('colspan') || 1;
        });

        if (cols === cells) {
          stripe = !stripe;
          $tr.addClass('bordered');
        }

        if (stripe) {
          $tr.addClass('striped');
        }
      });
    });
  }
});



$(function () {
  var
    headingOffsets,
    navHeight = $('#nav').height(),
    $currentHeading = $('#current_heading'),
    $navLinks =
      $('#nav_menu')
        .modal({ open: false })
        // scroll the modal to the current heading
        .on('modal:opened', function (event) {
          $(this).scrollTop($navLinks.eq($currentHeading.data('nav-link-index')).offset().top);
        })
        .find('a[href^="#"]');

  function setHeadingOffets() {
    headingOffsets = $navLinks.toArray().map(function(navLink) {
        return document.getElementById(navLink.getAttribute('href').substr(1)).offsetTop;
      });

    $(window).trigger('scroll');
  }

  if ($navLinks.length) {
    $(window)
      // set the heading offsets array on load and resize
      .on('resize', setHeadingOffets)
      // set the current heading on scroll
      .on('scroll', function () {
        try {
          var navLinkIndex = headingOffsets.findIndex(function (offsetTop) {
              return offsetTop > document.documentElement.scrollTop + navHeight;
            }) - 1;

          // if no offset is greater than the document's scroll top, the index will be -2
          if (navLinkIndex === -2) {
            // set it to -1 to get the last heading
            navLinkIndex = -1;
          }

          $currentHeading
            .data('nav-link-index', navLinkIndex)
            .html($navLinks.eq(navLinkIndex).html());
        } catch (ignore) {}
      });

    setHeadingOffets();

    // close the nav links modal when a link is clicked
    $navLinks
      .on('click', function () {
        $(this).trigger('modal:close');
      });

    // jump to previous and next headings
    $('#nav .fa-chevron-circle-up')
      .on('click', function () {
        $navLinks.eq($currentHeading.data('nav-link-index') - 1).get(0).click();
      });

    $('#nav .fa-chevron-circle-down')
      .on('click', function () {
        $navLinks.eq($currentHeading.data('nav-link-index') + 1).get(0).click();
      });
  }

  $(document)
    // close FAQs when clicking outside of them
    .on('click', function (event) {
      if (!$(event.target).closest('.faq, [data-footnote]').length) {
        $('.faq:not([hidden])').trigger('accessibleToggle:hide');
      }
    })
    // close FAQs with Esc
    .on('keyup', function (event) {
      if (event.keyCode === 27) {
        $('.faq:not([hidden])').trigger('accessibleToggle:hide');
      }
    });

  // change anchor text to heading number if it exists
  $('.default-layout #main a[href]').each(function () {
    try {
      var number = $($(this).attr('href').match(/(#.+)$/).pop()).data('heading');

      if (number) {
        this.innerHTML = number;
      }
    } catch (e) {}
  });

  // toggle FAQs by clicking their headings
  $('aside.faq').accessibleToggle({ hidden: true, parent: '#main' });

  // zebra stripe all army list table bodies that don't contain another army list table
  $('table.army-list:not(:has(table.army-list)) > tbody').zebraStripe();
});
