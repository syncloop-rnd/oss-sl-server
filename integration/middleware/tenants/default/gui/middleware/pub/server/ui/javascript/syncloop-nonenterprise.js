function collecta(action, user_id , event_category, event_label) {
    //START NON-ENTERPRISE-CODE

    try {
        gtag('event', action, {
            'event_category' : event_category,
            'event_label' : event_label,
            'tenant' : Cookies.get('tenant').split(" ")[0],
            'user_id' : user_id
        });
    } catch (error) {
       //console.log(error);
    }



    //END NON-ENTERPRISE-CODE
}
