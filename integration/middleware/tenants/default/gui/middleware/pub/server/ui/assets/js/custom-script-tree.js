
 jQuery(document).ready(function() {


    jQuery('#header-toggle').click(function(){
        jQuery('body').toggleClass('sidebar-hide', 1000);
    });


    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })


   //tree view js start
    $('.vertical-tree input[type="checkbox"]').change(checkboxChanged);
    
    function checkboxChanged() {
        var $this = $(this),
            checked = $this.prop("checked"),
            container = $this.parent(),
            siblings = container.siblings();
    
        container.find('input[type="checkbox"]')
        .prop({
            indeterminate: false,
            checked: checked
        })
        .siblings('label')
        .removeClass('custom-checked custom-unchecked')
        .addClass(checked ? 'custom-checked' : 'custom-unchecked');
        checkSiblings(container, checked);
    }
    
    function checkSiblings($el, checked) {
        var parent = $el.parent().parent(),
            all = true;
    
        $el.siblings().each(function() {
        return all = ($(this).children('input[type="checkbox"]').prop("checked") === checked);
        });
    
        if (all && checked) {
        parent.children('input[type="checkbox"]')
        .prop({
            indeterminate: false,
            checked: checked
        })
        .siblings('label')
        .removeClass('custom-checked custom-unchecked ')
        .addClass(checked ? 'custom-checked' : 'custom-unchecked');
    
        checkSiblings(parent, checked);
        } 
        else if (all && !checked) {
     
        parent.children('input[type="checkbox"]')
        .prop("checked", checked)
        .siblings('label')
        .removeClass('custom-checked custom-unchecked')
        .addClass(checked ? 'custom-checked' : 'custom-unchecked');
    
        checkSiblings(parent, checked);
        } 
        else {
        $el.parents("li").children('input[type="checkbox"]')
        .prop({
            checked: false
        })
        .siblings('label')
        .removeClass('custom-checked custom-unchecked ')
        }
    }


    // ------Vertical-tree-view
    $(function () {
        // $(".vertical-tree ul").hide();
        $(".vertical-tree>ul").show();
        $(".vertical-tree ul.active").show();
        $(".vertical-tree li .plus-minus-icon").on("click", function (e) {
            $(this).toggleClass('expend-hide', 1000);
            var children = $(this).siblings("ul");
            if (children.is(":visible")) children.hide("fast").removeClass("active");
            else children.show("fast").addClass("active");
            e.stopPropagation();
        });
    });
        

    // ------Tree-view End





 });
