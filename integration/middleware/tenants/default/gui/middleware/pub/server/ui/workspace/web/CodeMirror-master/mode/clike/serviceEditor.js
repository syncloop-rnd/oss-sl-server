function openCloneConfigurationForm() {
  var modal = document.getElementById("cloneModelDialog");
  var span = document.getElementById("closeCloneModelDialog");
  var cloneItButton = document.getElementById("cloneIt");
  modal.style.display = "block";
  span.onclick = function() {
    modal.style.display = "none";
    //$(".elementProperty").css("display","none");
  }

  $("#CloneInput").val(("#" + loadFile).replace("#files/packages/", "").replace(".service", ""));

  cloneItButton.onclick = function() {
    let newLocation = $("#CloneInput").val();
    if (newLocation.trim() == "") {
     swal({
        title: "Invalid Name",
        text: "Invalid new API service name.",
        type: "error",
        confirmButtonColor: "#f2533e" // Optional: Customize confirm button color
      });

      return ;
    }
    let newLocationArray = newLocation.split("/");
    if (newLocationArray.length < 2) {
      swal({
        title: "Invalid Path",
        text: "Please provide package name/folder name.",
        type: "error",
        confirmButtonColor: "#f2533e"
      });

      return ;
    }
    for (let i = 0 ; i < newLocationArray.length ; i++) {
      let message = validateVariableName(newLocationArray[i]);
      if ("" !=message) {
        swal({
          title: "Invalid Path/Name",
          text: message,
          type: "error",
          confirmButtonColor: "#f2533e"
        });

        return ;
      }
    }
    modal.style.display = "none";
    saveService(loadFile,  "files/packages/" + newLocation + ".service");
    cloneProperties("files/packages/" + newLocation + ".service");
    collecta('Save', '', 'Clone', 'Cloning API : ' + newLocation);
    parent.loadPackages();
  }

}

function UpdateConfigURL() {
  var inputelem = document.getElementById("serviceAliasValue");
  var s = inputelem.value;

  var labelelem = document.getElementById("full_path");
  var tempval = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant");

 /* var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var coo = cookies[i].split("=");
    if (coo[0].trim() == "tenant") {
      tempval = (location.origin + "/tenant/" + coo[1].replaceAll('"', "").split(" ")[0]);
    }
  }*/
  labelelem.value = tempval + s;
}

// Initial update.
UpdateConfigURL();

// Register event handlers.
var inputelem = document.getElementById("serviceAliasValue");
inputelem.addEventListener('keypress', UpdateConfigURL);
inputelem.addEventListener('keyup', UpdateConfigURL);
inputelem.addEventListener('input', UpdateConfigURL);
inputelem.addEventListener('change', UpdateConfigURL);

$(document).ready(function() {

  $(".ok_close").click(function() {
    $("#configureSetValueModelDialog, #elementPropertyModalDialog, #configureInputJSONSchemaTextDialog, #flowElementPropertyModalDialog, #configureMapLinePropertiesModelDialog, #configurePropertiesModelDialog").hide();
  });

  if (SDK_EMBEDDED) {
    return ;
  }
  if (!isInIframe()) {
    $("#service-c-m-option").hide();
  }
  loadGroupsDP();
  getAllEnvironments();

  if (null != localStorage.getItem("pre-dev-groups")) {

    const preDevGroups = JSON.parse(localStorage.getItem("pre-dev-groups"));

    $("#serviceDevelopers").val(preDevGroups.developers).trigger('change');
    $("#serviceConsumers").val(preDevGroups.consumers).trigger('change');
    SILENT_SAVE_ONCE = true;
    localStorage.removeItem("pre-dev-groups");
    save();
  }
  setTimeout(function() {
    flowIOHeightAdjuster()
  }, 1000);
  if (loadFile) {
    $("#flowFullScreen").attr("href", "../../../workspace/web/apiMaker/apiEditor.html?loadFile=" + loadFile);
    $("#serviceLog").attr("href", "../../../workspace/web/server-logs.html?serviceName=" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main"));
    //$("#
    // ").attr("href", "/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/,".main") + "/list");

    asyncRestRequest("/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main") + "/list", null, "GET", function(response) {
      $("#snapshotList").html("");
      if (null == response.fileDispose) {
        for (let i = 0; i < response.files.length; i++) {
          $("#downloadSnapshotBtn").removeAttr("disabled");
          $("#downloadSnapshotBtn").removeClass("btn_disabled");
          $("#downloadSnapshotBtn").addClass("btn");
          $("#downloadSnapshotBtn").addClass("btn-gry");

          $("#simulateSnapshotBtn").removeAttr("disabled");
          $("#simulateSnapshotBtn").removeClass("btn_disabled");
          $("#simulateSnapshotBtn").addClass("btn");
          $("#simulateSnapshotBtn").addClass("btn-gry");

          $("#snapshotList").append("<option>" + response.files[i] + "</option>");
        }
      } else {

        $(".select-dropdown__list").html('<li><div class="srch_dlt"><div class="ui left icon input srch_itm"><i class="search_icon2"></i><input type="text" id="snap-search" name="search" placeholder="Search..."></div><div class="delete_nm" style="display: none;"><a href="javascript:void(0)"><img src="../../../icons/snap-delete.svg"> Delete 0 item</a></div><div class="snap-group"><input type="checkbox" id="delete_snap"><label for="delete_snap">Delete snapshots</label></div></div></li>');

        for (let i = 0; i < response.fileDispose.length; i++) {
          /**/

          $(".select-dropdown__list").append('<li data-value="' + (response.fileDispose[i].name) + '" data-time="' + response.fileDispose[i].time + '" class="select-dropdown__list-item"><div class="snap-group-all"> <span class="chk_sh" style="display: none;"> <input class="chk_sty" data-snap="' + response.fileDispose[i].name + '" type="checkbox" id="delete_snap' + (i + 1) + '"> <label for="delete_snap' + (i + 1) + '"></label> </span><span class="description">' + response.fileDispose[i].name.replace(".snap", "") + '</span></div><span class="time">' + response.fileDispose[i].time + '</span></li>');

          //$("#snapshotList").append("<option value='" + response.fileDispose[i].key + "'>" + response.fileDispose[i].name + "</option>");
        }

        $("#snap-search").keyup(function(){
          let keyVal = this;
          $(".chk_sty").each(function () {
            if ($(keyVal).val().length <= 0) {
              $(this).parent().parent().parent().show();
            } else {
              if ($(this).parent().parent().parent().attr("data-value").includes($(keyVal).val())) {
                $(this).parent().parent().parent().show();
              } else {
                $(this).parent().parent().parent().hide();
              }
            }
          });
        });

        $("#delete_snap").click(function () {
          if ($(this).is(":checked")) {
            $(".chk_sh").show();
            $("#AddPassport").hide();
            $(".delete_nm").show();
            $(".srch_itm").hide();
          } else {
            $(".chk_sh").hide();
            $("#AddPassport").show();
            $(".delete_nm").hide();
            $(".srch_itm").show();
          }
        });

        $(".chk_sty").click(function () {
          $(".delete_nm").html('<a href="javascript:deleteSnaps()"><img src="../../../icons/snap-delete.svg"> Delete ' + $(".chk_sty:checked").length + ' item(s)</a>');
          if ($(".chk_sty:checked").length > 0) {
            $(".delete_nm a").css({"color": "#2C61F5"});
            $(".delete_nm a img").css({"filter": "invert(27%) sepia(51%) saturate(2878%) hue-rotate(195deg) brightness(90%) contrast(100%)"});
          } else {
            $(".delete_nm a").css({"color": "#7e7e7e"});
            $(".delete_nm a img").css({"filter": "invert(25%) sepia(15%) saturate(10%) hue-rotate(279deg) brightness(5%) contrast(1%)"});
          }
        });

        $('.select-dropdown__button').on('click', function(){
          $('.select-dropdown__list').toggleClass('active');
        });
        $('.select-dropdown__list-item').on('click', function(){
          var itemValue = $(this).data('value');
          $("#snapshotList").val(itemValue);
          $(".snap_time").show();
          $(".snap_time").html('<img src="../../../icons/cl-time.svg"> &nbsp; ' + $(this).data('time'));
          $('.select-dropdown__button span').text($(this).text()).parent().attr('data-value', itemValue);
          $('.select-dropdown__list').toggleClass('active');

          $("#downloadSnapshotBtn").removeAttr("disabled");
          $("#downloadSnapshotBtn").removeClass("btn_disabled");
          $("#downloadSnapshotBtn").addClass("btn");
          $("#downloadSnapshotBtn").addClass("btn-gry");

          $("#simulateSnapshotBtn").removeAttr("disabled");
          $("#simulateSnapshotBtn").removeClass("btn_disabled");
          $("#simulateSnapshotBtn").addClass("btn");
          $("#simulateSnapshotBtn").addClass("btn-gry");

        });
      }
    });
    focusOnElement(loadFile);

  }
});

$(document).on('click', '#closeSnapModelDialog', function() {
  $('.select-dropdown__list').toggleClass('active');
  $('#delete_snap').prop('checked', false);
  $('.chk_sty').prop('checked', false);
  $(".delete_nm").hide();
  $(".srch_itm").show();
});

function openPromotepopup() {
  var modal = document.getElementById("promoteModelDialog");
  var span = document.getElementById("closePromoteModelDialog");
  modal.style.display = "block";
  span.onclick = function() {
    modal.style.display = "none";

  }

}
function downloadBuild() {
  collecta('Export', '', 'Download', 'Downloading SQL Service');
  var content = JSON.stringify([{
    asset: loadFile.replaceAll("files/", "").replaceAll(".service", ""),
    type: "service"
  }]);

  let array = loadFile.replaceAll("files/", "").replaceAll(".service", "").split("/");

  var qp = "buildName=" + array[array.length - 1] + "_" + new Date().getTime() + "&includeDependencies=" + false + "&includeGlobalProperties=" + false +
    "&includeLocalProperties=" + false + "&includeEndpoints=" + false;
  var response = syncRestRequest("/build?" + qp, "POST", content, "application/json", "application/json");
  if (response.status == 200) {
    var jObj = JSON.parse(response.payload);

      //alert(jObj.msg);
      var element = document.createElement('a');
      var responseUrl = JSON.parse(response.payload).url
      element.setAttribute('href', window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + responseUrl
        + "?access_token=" + encodeURIComponent(localStorage.getItem("AuthToken")));
      element.setAttribute('target', "_blank");
      document.body.appendChild(element);
      element.click();
  }else{
    swal({
        title: jObj.msg,
        text: "",
        type: "error",
        confirmButtonColor: "#f2533e"
    });

  }
}

function promoteModal() {
  if (ENV_SIZE == 0) {
    return;
  }
  var modal = document.getElementById("proServiceModelDialog");
  var span = document.getElementById("closeproServiceModelDialog");
  modal.style.display = "block";
  span.onclick = function() {
    modal.style.display = "none";
    $(".promoting-servers:checked").prop('checked', false);
  }

  $("#closePromoteModelDialog").trigger('click');


}

