// select2 init

$(function(){

    // basic
    $(".option_s1").select2({
		placeholder: "What kind of work do you do?",
		minimumResultsForSearch: Infinity
		
	});
	
	$(".option_s111").select2({
		placeholder: "Select Group",
		minimumResultsForSearch: Infinity
		
	});

    // nested
    $('#option_s2').select2({
        placeholder: "Select a state"
    });

    // multi select
	
	$('.multi-options').select2();
	
    $('#survey-opt').select2();

    $('#option_s3').select2({
        placeholder: "Select a Designation"
    });
	
	$('#option_s4').select2({
        placeholder: "Select a Designation"
    });
	
	$('#option_s55').select2({
        placeholder: "Select a Designation"
    });
	
	$('#option_s56').select2({
        placeholder: "Select a Designation"
    });
	
	$('#option_s57').select2({
        placeholder: "Select a Designation"
    });
	
	$('#option_s58').select2({
        placeholder: "Select a Designation"
    });
	
	$('#option_s59').select2({
        placeholder: "Select a Designation"
    });
	
	$('#option_s60').select2({
        placeholder: "Order Filter"
    });
	

    // placeholder
    $("#option_s4").select2({
        placeholder: "Select a Employee",
        allowClear: true
    });

    // placeholder
    $("#option_s5").select2({
        minimumInputLength: 2
    });

    // loading data from array
    var data = [{
        id: 0,
        text: 'Bootstrap'
    }, {
        id: 1,
        text: 'Admin'
    }, {
        id: 2,
        text: 'Dashboard'
    }, {
        id: 3,
        text: 'Modern'
    }, {
        id: 4,
        text: 'Sazzad'
    },
        {
        id: 5,
        text: 'Sabrin'
    }];

    $('#option_s6').select2({
        placeholder: "Select a value",
        data: data
    });

    // disabled mode
    $('#option_s7').select2({
        placeholder: "Select an option"
    });

    // hiding the search box
    $('#option_s8').select2({
        placeholder: "Select hidden option",
        minimumResultsForSearch: Infinity
    });

    // tagging support
    $('#option_s9').select2({
        placeholder: "Add a tag",
        tags: true
    });

});



