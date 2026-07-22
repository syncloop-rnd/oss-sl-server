//toast

;
(function(window, $) {
    "use strict";

    var defaultConfig = {
        type: '',
        autoDismiss: false,
        container: '#toasts',
        autoDismissDelay: 4000,
        transitionDuration: 500
    };

    $.toast = function(config) {
        var size = arguments.length;
        var isString = typeof(config) === 'string';

        if (isString && size === 1) {
            config = {
                message: config
            };
        }

        if (isString && size === 2) {
            config = {
                message: arguments[1],
                type: arguments[0]
            };
        }

        return new toast(config);
    };

    var toast = function(config) {
        config = $.extend({}, defaultConfig, config);
        // show "x" or not
        var close = config.autoDismiss ? '' : '&times;';

        // toast template
        var toast = $([
            '<div class="toast ' + config.type + '">',
            '<p>' + config.message + '</p>',
            '<div class="close">' + close + '</div>',
            '</div>'
        ].join(''));

        // handle dismiss
        toast.find('.close').on('click', function() {
            var toast = $(this).parent();

            toast.addClass('hide');

            setTimeout(function() {
                toast.remove();
            }, config.transitionDuration);
        });

        // append toast to toasts container
        $(config.container).append(toast);

        // transition in
        setTimeout(function() {
            toast.addClass('show');
        }, config.transitionDuration);

        // if auto-dismiss, start counting
        if (config.autoDismiss) {
            setTimeout(function() {
                toast.find('.close').click();
            }, config.autoDismissDelay);
        }

        return this;
    };

})(window, jQuery);

/* ---- start demo code ---- */

var count = 1;
var types = ['default', 'error', 'warning', 'info'];

$('button').click(function() {
    var data = this.dataset;

    switch (data.type) {
        case 'types':
            $.toast(data.kind, 'This is a ' + data.kind + ' toast.');
            break;
        case 'error':
            $.toast('<div class="custom-toast"><span class="tst red"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><defs><style>.cls-1 {fill: #fff;fill-rule: evenodd;}</style></defs><g id="notification_error"><path class="cls-in" d="M275.5,28A12.5,12.5,0,1,1,288,15.5,12.514,12.514,0,0,1,275.5,28Zm0-24A11.5,11.5,0,1,0,287,15.5,11.513,11.513,0,0,0,275.5,4Zm-0.473,13.867-2.241,2.241a1.339,1.339,0,0,1-1.894-1.894l2.241-2.241a0.669,0.669,0,0,0,0-.947l-2.241-2.241a1.339,1.339,0,0,1,1.894-1.894l2.241,2.241a0.67,0.67,0,0,0,.947,0l2.24-2.241a1.339,1.339,0,0,1,1.894,1.894l-2.241,2.241a0.671,0.671,0,0,0,0,.947l2.241,2.241a1.339,1.339,0,0,1-1.894,1.894l-2.24-2.241a0.67,0.67,0,0,0-.947,0h0Z" transform="translate(-260)"/></g></svg></span><div class="t_info"><h5>Oops!</h5><span>Enter the correct email address and password to log in</span></div></div>');
            break;

            break;
        case 'success':
            $.toast('<div class="custom-toast"><span class="tst green"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><defs><style>.cls-1 {fill: #fff;fill-rule: evenodd;}</style></defs><g id="notification_success"><path class="cls-in" d="M405.5,28A12.5,12.5,0,1,1,418,15.5,12.514,12.514,0,0,1,405.5,28Zm0-24A11.5,11.5,0,1,0,417,15.5,11.513,11.513,0,0,0,405.5,4Zm6.171,8.578-7.056,7a1.086,1.086,0,0,1-1.522.028l-3.736-3.4a1.122,1.122,0,0,1-.083-1.55,1.1,1.1,0,0,1,1.55-.055l2.96,2.712L410.094,11A1.115,1.115,0,0,1,411.671,12.578Z" transform="translate(-390)"/></g></svg></span><div class="t_info"><h5>Successful!</h5><span>You have successfully logged in</span></div></div>');
            break;

            break;
        case 'info':
            $.toast('<div class="custom-toast"><span class="tst blue"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><defs><style>.cls-1 {fill: #fff;fill-rule: evenodd;}</style></defs><g id="notification_info"><path class="cls-in" d="M15.5,28A12.5,12.5,0,1,1,28,15.5,12.514,12.514,0,0,1,15.5,28Zm0-24A11.5,11.5,0,1,0,27,15.5,11.512,11.512,0,0,0,15.5,4Zm1.606,17.21a1.6,1.6,0,0,1-3.2,0V14.234a1.6,1.6,0,0,1,3.2,0V21.21ZM15.5,11.322a1.759,1.759,0,1,1,1.759-1.759A1.759,1.759,0,0,1,15.5,11.322Z"/></g></svg></span><div class="t_info"><h5>Info!</h5><span>Add your info message here</span></div></div>');
            break;

            break;
        case 'warning':
            $.toast('<div class="custom-toast"><span class="tst orange"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><defs><style>.cls-1 {fill: #fff;fill-rule: evenodd;}</style></defs><g id="notification_alert"><path class="cls-in" d="M155.679,19.911L147.862,6.264a3.314,3.314,0,0,0-5.778,0l-7.822,13.646a3.368,3.368,0,0,0,2.889,5.055h15.612A3.385,3.385,0,0,0,155.679,19.911Zm-10.711,2.027a1.254,1.254,0,0,1,0-2.509A1.255,1.255,0,0,1,144.968,21.938Zm1.135-8.11c-0.055.972-.115,1.94-0.17,2.912-0.028.315-.028,0.6-0.028,0.912a0.94,0.94,0,0,1-.937.912,0.92,0.92,0,0,1-.937-0.884c-0.083-1.514-.17-3-0.252-4.513-0.028-.4-0.056-0.8-0.088-1.2a1.362,1.362,0,0,1,.965-1.37,1.247,1.247,0,0,1,1.447.713,1.509,1.509,0,0,1,.114.629C146.19,12.574,146.13,13.2,146.1,13.828Z" transform="translate(-130)"/></g></svg></span><div class="t_info"><h5>Warning!</h5><span>Add your warning message here</span></div></div>');
            break;

        case 'auto':
            $.toast({
                autoDismiss: true,
                message: 'This is my auto-dismiss toast message'
            });

            break;

        //default:
        //$.toast('Hello there!');
    }
});


/* ---- end demo code ---- */