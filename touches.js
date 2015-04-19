(function(root, $) {
    'use strict';
    $(function() {
        var supportEvents = ['tap', 'longTap', 'doubleTap', 'swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'touchstart', 'touchmove', 'moveLeft', 'moveRight', 'moveUp', 'moveDown', 'touchend', 'touchcancel'];
        var defaultConfig = {
            longTapDelay: 750,
            swipeRightAngle: 30,
            swipeLeftAngle: 30,
            swipeDownAngle: 30,
            swipeUpAngle: 30,
            swipeMinX: 30,
            swipeMinY: 30,
            tapMaxX: 10,
            tapMaxY: 10,
            preventScrollRight: true,
            preventScrollLeft: true,
            preventScrollUp: false,
            preventScrollDown: false,
            moveDetect: false
        };
        var touch = {},
            _longTapTimeout;
        var getMoveDirection = function(x1, y1, x2, y2) {
            return Math.abs(x1 - x2) >=
                Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down');
        };
        var getSwipeDirection = function(dx, dy, angle) {
            if (dx > 0 && Math.abs(angle) < defaultConfig.swipeRightAngle) {
                return 'Right';
            }
            if (dx < 0 && Math.abs(angle) < defaultConfig.swipeLeftAngle) {
                return 'Left';
            }
            if (dy > 0 && Math.abs(angle) > (90 - defaultConfig.swipeDownAngle)) {
                return 'Down';
            }
            if (dy < 0 && Math.abs(angle) > (90 - defaultConfig.swipeUpAngle)) {
                return 'Up';
            }
        };
        var getAngle = function(n) {
            return Math.atan(n) * 180 / Math.PI;
        };
        var cancelLongTap = function() {
            if (_longTapTimeout) {
                clearTimeout(_longTapTimeout);
                _longTapTimeout = null;
            }
        };
        var longTap = function() {
            cancelLongTap();
            touch.el.trigger('longTap');
            touch = {};
        };
        var setPointInfo = function(point) {
            touch.x2 = point.clientX;
            touch.y2 = point.clientY;
            touch.dx = touch.x2 - touch.x1;
            touch.dy = touch.y2 - touch.y1;
            touch.angle = getAngle(touch.dy / touch.dx);
            touch.direction = getSwipeDirection(touch.dx, touch.dy, touch.angle);
            touch.moveDirection = getMoveDirection(touch._lastX, touch._lastY, touch.x2, touch.y2);
            touch._distanceX += Math.abs(touch.x2 - touch._lastX);
            touch._distanceY += Math.abs(touch.y2 - touch._lastY);
            touch._lastX = touch.x2;
            touch._lastY = touch.y2;
        };
        $(document).on('touchstart MSPointerDown pointerdown', function(e) {
            if (e.touches && e.touches.length === 1 && touch.x2) {
                touch.x2 = undefined;
                touch.y2 = undefined;
                touch._lastX = undefined;
                touch._lastY = undefined;
            }
            var now = Date.now();
            var delta = now - (touch._last || now);
            var point = e.touches[0];
            touch.x1 = touch._lastX = point.clientX;
            touch.y1 = touch._lastY = point.clientY;
            touch.el = $('tagName' in point.target ? point.target : point.target.parentNode);
            if (delta > 0 && delta <= 250) {
                touch.isDoubleTap = true;
            }
            touch._last = now;
            touch._distanceX = touch._distanceY = 0;
            _longTapTimeout = setTimeout(longTap, defaultConfig.longTapDelay);
        }).on('touchmove MSPointerMove pointermove', function(e) {
            var point = e.touches[0];
            if (e.touches.length > 1) {
                touch.mutiTouch = true;
            } else {
                touch.mutiTouch = false;
            }
            cancelLongTap();
            setPointInfo(point);
            if (defaultConfig.moveDetect) {
                touch.el.trigger('move', [touch]);
                touch.el.trigger('move' + touch.moveDirection, [touch]);
            }
            if (defaultConfig['preventScroll' + touch.direction]) {
                e.preventDefault();
            }
        }).on('touchend MSPointerUp pointerup touchcancel MSPointerCancel pointercancel', function(e) {
            cancelLongTap();
            if (e.changedTouches && e.changedTouches.length) {
                var point = e.changedTouches[0];
                setPointInfo(point);
            }
            if (((touch.direction === 'Left' || touch.direction === 'Right') && Math.abs(touch.dx) > defaultConfig.swipeMinX) || ((touch.direction === 'Up' || touch.direction === 'Down') && Math.abs(touch.dy) > defaultConfig.swipeMinY)) {
                touch.swipeTimeout = setTimeout(function() {
                    touch.el.trigger('swipe', [touch]);
                    touch.el.trigger('swipe' + touch.direction, [touch]);
                    touch = {};
                }, 0);
            } else {
                if (touch._distanceX < defaultConfig.tapMaxX && touch._distanceY < defaultConfig.tapMaxY) {
                    touch.tapTimeout = setTimeout(function() {
                        touch.el.trigger('tap');
                        if (touch.isDoubleTap) {
                            touch.el.trigger('doubleTap');
                            touch = {};
                        }
                    }, 0);
                } else {
                    touch = {};
                }
            }
        });
        supportEvents.forEach(function(eventName) {
            $.fn[eventName] = function(callback) {
                return this.on(eventName, callback);
            };
        });
    });
})(window, window.jQuery || window.Zepto);