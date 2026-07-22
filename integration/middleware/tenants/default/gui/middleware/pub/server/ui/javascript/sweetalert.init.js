try {
    document.querySelector('.sweet-wrong').onclick = function(){
        sweetAlert("Oops...", "Something went wrong !!", "error");
    };
    document.querySelector('.sweet-message').onclick = function(){
        swal({
                title: "Hey, Here's a message !!",
                type: "info",
                confirmButtonColor: "#2C61F5" // Optional: custom confirm button color
            });

    };
    document.querySelector('.sweet-text').onclick = function(){
        swal({
                title: "Hey, Here's a message !!",
                text: "It's pretty, isn't it?",
                type: "info", // or "success", "warning", "error" as needed
                confirmButtonColor: "#2C61F5" // optional styling
            });

    };
    document.querySelector('.sweet-success').onclick = function(){
        swal({
                title: "Hey, Good job !!",
                text: "You clicked the button !!",
                type: "success",
                confirmButtonColor: "#2C61F5" // optional custom button color
                });

    };
    document.querySelector('.sweet-confirm').onclick = function(){
        swal({
                title: "Are you sure to delete ?",
                text: "You will not be able to recover this imaginary file !!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#f2533e",
                confirmButtonText: "Yes, delete it !!",
                closeOnConfirm: false
            },
            function(){
               swal({
                    title: "Deleted !!",
                    text: "Hey, your imaginary file has been deleted !!",
                    type: "success",
                    confirmButtonColor: "#2C61F5" // Optional: customize success button color
                });

            });
    };
    document.querySelector('.sweet-success-cancel').onclick = function(){
        swal({
                title: "Are you sure to delete ?",
                text: "You will not be able to recover this imaginary file !!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#f2533e",
                confirmButtonText: "Yes, delete it !!",
                cancelButtonText: "No, cancel it !!",
                closeOnConfirm: false,
                closeOnCancel: false
            },
            function(isConfirm){
                if (isConfirm) {
                    swal({
                                title: "Deleted !!",
                                text: "Hey, your imaginary file has been deleted !!",
                                type: "success",
                                confirmButtonColor: "#2C61F5" // Custom success button color
                         });

                }
                else {
                   swal({
                            title: "Cancelled !!",
                            text: "Hey, your imaginary file is safe !!",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                     });

                }
            });
    };
    document.querySelector('.sweet-image-message').onclick = function(){
        swal({
            title: "Sweet !!",
            text: "Hey, Here's a custom image !!",
            imageUrl: "images/hand.jpg",
            confirmButtonColor: "#2C61F5"
        });
    };
    document.querySelector('.sweet-html').onclick = function(){
        swal({
            title: "Sweet !!",
            text: "<span style='color:#ff0000'>Hey, you are using HTML !!<span>",
            html: true,
             confirmButtonColor: "#2C61F5"
        });
    };
    document.querySelector('.sweet-auto').onclick = function(){
        swal({
            title: "Sweet auto close alert !!",
            text: "Hey, i will close in 2 seconds !!",
            timer: 2000,
            showConfirmButton: false,
             confirmButtonColor: "#2C61F5"
        });
    };
    document.querySelector('.sweet-prompt').onclick = function(){
        swal({
                title: "Enter an input !!",
                text: "Write something interesting !!",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
                inputPlaceholder: "Write something",
                 confirmButtonColor: "#2C61F5"
            },
            function(inputValue){
                if (inputValue === false) return false;
                if (inputValue === "") {
                    swal.showInputError("You need to write something!");
                    return false
                }
               swal({
                        title: "Hey !!",
                        text: "You wrote: " + inputValue,
                        type: "success",
                        confirmButtonColor: "#2C61F5" // Optional: custom button color
                });

            });
    };
    document.querySelector('.sweet-ajax').onclick = function(){
        swal({
                title: "Sweet ajax request !!",
                text: "Submit to run ajax request !!",
                type: "info",
                showCancelButton: true,
                confirmButtonColor: "#2C61F5",
                closeOnConfirm: false,
                showLoaderOnConfirm: true,
            },
            function(){
                setTimeout(function(){
                      swal({
                        title: "Hey !!",
                        text: "You wrote: " + inputValue,
                        type: "success",
                        confirmButtonColor: "#2C61F5" // Optional: custom button color
                });
                    swal({
                            title: "Hey !!",
                            text: "Your ajax request finished !!",
                            icon: "success",
                            confirmButtonColor: "#2C61F5" // Optional: custom button color
                    });

                }, 2000);
            });
    };

} catch (e) {

}
