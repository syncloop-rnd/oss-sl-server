(function () {
    var SETTINGS_URL = "middleware/pub/server/ui/workspace/web/setting.html?tab=profile";
    var WORKSPACE_URL = "middleware/pub/server/ui/workspace/web/workspace.html?utm_source=Workspace&utm_medium=workspace-page";
    var API_BASE = (window.ENV && window.ENV.API_BASE_URL) || window.location.origin;
    var tenantCreationEnabled = false;
    var HEADER_HTML = [
        '<div class="workspace-profile-root">',
        '    <div class="head_rightpanel">',
        '        <div class="tenant-switcher">',
        '            <button type="button" class="tenant-trigger" id="workspace-tenant-trigger" aria-expanded="false">',
        '                <span class="head_tenant" id="workspace-header-tenant"></span>',
        '                <img class="tenant-trigger-arrow" src="middleware/pub/server/ui/assets/img/white-dropdown.svg" alt="">',
        '            </button>',
        '            <div class="tenant-modal" id="workspace-tenant-modal">',
        '                <div class="tenant-modal-header">',
        '                    <h2>Available tenants</h2>',     
        '                </div>',
        // '                <div class="tenant-count" id="workspace-tenant-count">0 tenants</div>',
        '                <div class="tenant-feedback" id="workspace-tenant-feedback"></div>',
        '                <div class="tenant-list" id="tenant-list">',
        '                    <div class="tenant-empty">Loading tenants...</div>',
        '                </div>',
        '            </div>',
        '        </div>',
        '        <div class="profile-shell">',
        '            <span class="head_username" id="workspace-profile-trigger"><span class="avatar-loader"></span></span>',
        '            <div class="profile-card" id="workspace-profile-card">',
        '                <div class="header">',
        '                    <div class="email" id="workspace-profile-email">user@syncloop</div>',
        '                    <div class="close-btn" id="workspace-profile-close">',        
        '                    </div>',
        '                </div>',
        '                <div class="avatar" id="workspace-profile-avatar">NK</div>',
        '                <div class="greeting" id="workspace-profile-greeting">Hi, User!</div>',
        '                <div class="menu-item" data-profile-action="settings"><span class="icon"><img src="middleware/pub/server/ui/assets/img/setting.svg"></span><span>Settings</span></div>',
        '                <div class="menu-item" data-profile-action="workspace"><span class="icon"><img src="middleware/pub/server/ui/assets/img/goto-workspace.svg"></span><span>Go to workspace</span></div>',
        '                <div class="menu-item" data-profile-action="clear-cache"><span class="icon"><img src="middleware/pub/server/ui/assets/img/clear_cache.svg"></span><span>Clear cache</span></div>',
        '                <div class="menu-item" data-profile-action="logout"><span class="icon"><img src="middleware/pub/server/ui/assets/img/Logout.svg"></span><span class="logout-color">Logout</span></div>',
        '            </div>',
        '        </div>',
        '    </div>',
        '</div>'
    ].join("");

    function ensureTenantActionStyles() {
        if (document.getElementById("workspace-tenant-action-styles")) {
            return;
        }

        var style = document.createElement("style");
        style.id = "workspace-tenant-action-styles";
        style.textContent = [
            ".tenant-copy-action,.tenant-edit-action{position:relative;display:inline-flex;align-items:center;justify-content:center;}",
            ".tenant-copy-action::after,.tenant-edit-action::after{background:#111827;border-radius:4px;top:calc(100% + 8px);color:#fff;content:attr(data-tooltip);font-size:12px;font-weight:600;left:auto;right:0;line-height:1;opacity:0;padding:7px 9px;pointer-events:none;position:absolute;transform:translateY(-4px);transition:opacity .15s ease,transform .15s ease;white-space:nowrap;z-index:10;}",
            ".tenant-copy-action::before,.tenant-edit-action::before{border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:5px solid #111827;top:calc(100% + 3px);content:\"\";left:auto;right:10px;opacity:0;pointer-events:none;position:absolute;transform:translateY(-4px);transition:opacity .15s ease,transform .15s ease;z-index:10;}",
            ".tenant-copy-action.tenant-copy-confirmed::after,.tenant-copy-action.tenant-copy-confirmed::before,.tenant-edit-action:hover::after,.tenant-edit-action:hover::before{opacity:1;transform:translateY(0);}"
            ,".tenant-copy-action::after,.tenant-copy-action::before,.tenant-edit-action::after,.tenant-edit-action::before{display:none!important;}"
            ,".tenant-tooltip-portal{position:fixed;z-index:100000;background:#111827;border-radius:4px;color:#fff;font-size:12px;font-weight:600;line-height:1;padding:7px 9px;pointer-events:none;white-space:nowrap;}"
        ].join("");
        document.head.appendChild(style);
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    function bindTenantTooltipPortals(list) {
    Array.prototype.forEach.call(list.querySelectorAll(".tenant-copy-action"), function (action) {
        action.addEventListener("mouseenter", function () {
            var tooltip = document.createElement("div");
            var rect = action.getBoundingClientRect();
            tooltip.className = "tenant-tooltip-portal";
            tooltip.textContent = action.getAttribute("data-tooltip") || "";
            document.body.appendChild(tooltip);

            // ✅ Left se align
            tooltip.style.top = (rect.bottom + 8) + "px";
            tooltip.style.left = Math.max(8, rect.left) + "px";

            action._tenantTooltip = tooltip;
        });

        action.addEventListener("mouseleave", function () {
            if (action._tenantTooltip) {
                // ✅ Sirf tab remove karo jab "Copied" nahi show ho raha
                if (action._tenantTooltip.textContent !== "Copied") {
                    action._tenantTooltip.remove();
                    action._tenantTooltip = null;
                }
            }
        });

        action.addEventListener("click", function () {
            if (action._tenantTooltip) {
                action._tenantTooltip.textContent = "Copied";

                // ✅ Left position recalculate
                var rect = action.getBoundingClientRect();
                action._tenantTooltip.style.left = Math.max(8, rect.left) + "px";

                // ✅ 1.5 second baad "Copy Tenant ID" wapas aaye
                window.setTimeout(function () {
                    if (action._tenantTooltip) {
                        action._tenantTooltip.textContent = "Copy Tenant ID";

                        // ✅ Reset hone ke baad bhi left position sahi rahe
                        var rect = action.getBoundingClientRect();
                        action._tenantTooltip.style.left = Math.max(8, rect.left) + "px";
                    }
                }, 1500);
            }
        });
    });
   Array.prototype.forEach.call(list.querySelectorAll(".tenant-edit-action"), function (action) {
    var tooltip = null;

    action.addEventListener("mouseenter", function () {
        tooltip = document.createElement("div");

        var rect = action.getBoundingClientRect();

        tooltip.className = "tenant-tooltip-portal";
        tooltip.textContent = action.getAttribute("data-tooltip") || "";

        document.body.appendChild(tooltip);

        tooltip.style.top = (rect.bottom + 8) + "px";
        tooltip.style.left = Math.max(8, rect.left) + "px";
    });

    action.addEventListener("mouseleave", function () {
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
    });
});
}

    function getInitials(profile, userId) {
        var preferredName = "";

        if (profile && profile.name && profile.name.trim() !== "") {
            preferredName = profile.name.trim();
        } else if (userId && userId.trim() !== "") {
            preferredName = userId.trim();
        } else if (profile && profile.email && profile.email.trim() !== "") {
            preferredName = profile.email.trim().split("@")[0];
        } else {
            preferredName = "User";
        }

        var parts = preferredName.split(/\s+/).filter(Boolean);
        if (parts.length > 1) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }

        return preferredName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 2).toUpperCase() || "U";
    }

    function getDisplayName(profile, userId, email) {
        if (profile && profile.name && profile.name.trim() !== "") {
            return profile.name.trim();
        }
        if (email && email.trim() !== "") {
            return email.trim();
        }
        if (userId && userId.trim() !== "") {
            return userId.trim();
        }
        return "User";
    }
function getTenantInitials(name) {
    name = String(name || "U").trim();

    var parts = name.split(/[\s_-]+/).filter(Boolean);

    if (parts.length >= 2) {
        return (
            parts[0].charAt(0) +
            parts[1].charAt(0)
        ).toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
}

    function getTenantMemberCount(tenant) {
        var possibleKeys = ["memberCount", "membersCount", "members", "userCount", "usersCount", "users"];
        var index;

        for (index = 0; index < possibleKeys.length; index += 1) {
            var value = tenant ? tenant[possibleKeys[index]] : null;
            if (typeof value === "number" && isFinite(value)) {
                return value;
            }
            if (Object.prototype.toString.call(value) === "[object Array]") {
                return value.length;
            }
            if (value && typeof value.length === "number") {
                return value.length;
            }
        }

        return 0;
    }

    function getTenantMemberLabel(tenant) {
        var count = getTenantMemberCount(tenant);
        return count + " " + (count === 1 ? "Member" : "Members");
    }

    function getTenantDisplayName(tenant) {
        return (tenant && (tenant.displayName || tenant.tenantName || tenant.name || tenant.tenant)) || "Unnamed tenant";
    }

    function getTenantSwitchName(tenant) {
        return (tenant && (tenant.name || tenant.tenant || tenant.tenantName || tenant.displayName)) || "";
    }

    function tenantMatchesName(tenant, name) {
        var normalizedName = normalizeTenantName(name);
        return !!normalizedName && [
            tenant && tenant.name,
            tenant && tenant.tenant,
            tenant && tenant.tenantName,
            tenant && tenant.displayName,
            tenant && tenant.tenantId,
            tenant && tenant.uuid
        ].some(function (value) {
            return normalizeTenantName(value) === normalizedName;
        });
    }

    function normalizeTenantName(name) {
        return String(name || "").trim().toLowerCase();
    }

    function getStoredTenant() {
        return localStorage.getItem("tenant")
            || localStorage.getItem("loginTenant")
            || (window.USER_PROFILE && window.USER_PROFILE.profile && window.USER_PROFILE.profile.tenant)
            || "default";
    }

    function getStoredTenantDisplayName() {
        return localStorage.getItem("tenantDisplayName") || getStoredTenant();
    }

    function setStoredTenant(tenantName, displayName) {
        if (!tenantName) {
            return;
        }
        var previousTenantName = getStoredTenant();
        localStorage.setItem("tenant", tenantName);
        localStorage.setItem("loginTenant", tenantName);
        if (displayName) {
            localStorage.setItem("tenantDisplayName", displayName);
        } else if (normalizeTenantName(previousTenantName) !== normalizeTenantName(tenantName)) {
            localStorage.removeItem("tenantDisplayName");
        }
    }

   function updateHeaderTenantName(root, tenantName) {
    var headerTenant = root && root.querySelector("#workspace-header-tenant");

    if (!headerTenant) {
        return;
    }

    // empty value ignore karo
    if (!tenantName || tenantName.trim() === "") {
        return;
    }

    // only replace when new value available
    headerTenant.textContent = tenantName;
}

function copyTenantText(text, action) {
    function showTooltip(message) {
        if (!action) {
            return;
        }
        // Portal tooltip update karo
        if (action._tenantTooltip) {
            action._tenantTooltip.textContent = message;
        }
        action.setAttribute("data-tooltip", message);
        action.classList.add("tenant-copy-confirmed");

        window.setTimeout(function () {
            action.classList.remove("tenant-copy-confirmed");
            // ✅ 1.5 second baad "Copy Tenant ID" wapas aaye
            action.setAttribute("data-tooltip", "Copy Tenant ID");
            if (action._tenantTooltip) {
                action._tenantTooltip.textContent = "Copy Tenant ID";
            }
        }, 1500);  // ✅ 1500ms = 1.5 second
    }

        function fallbackCopy() {
            var input = document.createElement("textarea");
            input.value = text;
            input.setAttribute("readonly", "");
            input.style.position = "fixed";
            input.style.opacity = "0";
            document.body.appendChild(input);
            input.select();
            try {
                document.execCommand("copy");
                showTooltip("Copied");
            } catch (error) {
                showTooltip("Copy failed");
            }
            document.body.removeChild(input);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                showTooltip("Copied");
            }).catch(fallbackCopy);
            return;
        }
        fallbackCopy();
    }

    function getStoredUserId(response) {
        return localStorage.getItem("loginUserId")
            || (response && response.userId)
            || (window.USER_PROFILE && window.USER_PROFILE.userId)
            || "";
    }

    function getHostElement() {
        return document.querySelector(".workspace-profile-header-host")
            || document.querySelector("header .navbar-nav.tp_m .nav-item.text-nowrap")
            || document.querySelector("header .dropdown.navbar-right.tp_m");
    }

    function getExistingRoot() {
        return document.querySelector(".workspace-profile-root");
    }

    function closeProfileCard(root) {
        var card = root.querySelector("#workspace-profile-card");
        if (card) {
            card.classList.remove("show");
        }
    }

    function closeTenantModal(root) {
        var modal = root.querySelector("#workspace-tenant-modal");
        var trigger = root.querySelector("#workspace-tenant-trigger");

        if (modal) {
            modal.classList.remove("show");
        }
        if (trigger) {
            trigger.classList.remove("is-open");
            trigger.setAttribute("aria-expanded", "false");
        }
    }

    function openTenantModal(root) {
        var modal = root.querySelector("#workspace-tenant-modal");
        var trigger = root.querySelector("#workspace-tenant-trigger");

        if (!modal || !trigger) {
            return;
        }

        closeProfileCard(root);
        modal.classList.add("show");
        trigger.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
    }

    function setTenantFeedback(root, message, isError) {
        var feedback = root.querySelector("#workspace-tenant-feedback");
        if (!feedback) {
            return;
        }

        if (!message) {
            feedback.textContent = "";
            feedback.className = "tenant-feedback";
            return;
        }

        feedback.textContent = message;
        feedback.className = "tenant-feedback show" + (isError ? " error" : "");
    }

    function setTenantLoading(root, message, countText) {
        var list = root.querySelector("#tenant-list");
        var count = root.querySelector("#workspace-tenant-count");

        if (count) {
            count.textContent = countText || "Loading";
        }
        if (list) {
            list.innerHTML = '<div class="tenant-empty">' + escapeHtml(message || "Loading tenants...") + '</div>';
        }
    }

    function updateHeaderProfile(root, response) {
        var profile = response && response.profile ? response.profile : {};
        var profileEmail = profile.email && profile.email.trim() !== "" ? profile.email.trim() : "user@syncloop";
        var profileInitials = getInitials(profile, response ? response.userId : "");
        var displayName = getDisplayName(profile, response ? response.userId : "", profileEmail);
        var tenantName = localStorage.getItem("tenantDisplayName") || getStoredTenant();

        if (response && response.userId) {
            localStorage.setItem("loginUserId", response.userId);
        }

        if (profile && profile.tenant && profile.tenant.trim() !== "") {
            setStoredTenant(profile.tenant.trim());
            tenantName = profile.tenant.trim();
        }

        updateHeaderTenantName(root, getStoredTenantDisplayName());
        root.querySelector("#workspace-profile-trigger").textContent = profileInitials;
        root.querySelector("#workspace-profile-avatar").textContent = profileInitials;
        root.querySelector("#workspace-profile-email").textContent = profileEmail;
        root.querySelector("#workspace-profile-greeting").textContent = "Hi, " + displayName + "!";
    }

   function renderTenantList(root, tenants) {
    var list = root.querySelector("#tenant-list");
    var count = root.querySelector("#workspace-tenant-count");
    var normalizedActiveTenant = normalizeTenantName(getStoredTenant());

    var orderedTenants = (tenants || []).slice().sort(function (leftTenant, rightTenant) {
        var leftIsActive = tenantMatchesName(leftTenant, normalizedActiveTenant);
        var rightIsActive = tenantMatchesName(rightTenant, normalizedActiveTenant);

        if (leftIsActive === rightIsActive) {
            return 0;
        }
        return leftIsActive ? -1 : 1;
    });

    root._workspaceTenants = orderedTenants;
    setTenantFeedback(root, "", false);

    if (count) {
        count.textContent = orderedTenants.length + (orderedTenants.length === 1 ? " tenant" : " tenants");
    }

    if (!list) {
        return;
    }

    if (!orderedTenants.length) {
        list.innerHTML = '<div class="tenant-empty">No tenants available.</div>';
        return;
    }

    var activeTenant = null;
    var otherTenants = [];

    orderedTenants.forEach(function (tenant) {
        if (tenantMatchesName(tenant, normalizedActiveTenant)) {
            activeTenant = tenant;
        } else {
            otherTenants.push(tenant);
        }
    });

    if (activeTenant) {
        updateHeaderTenantName(root, getTenantDisplayName(activeTenant));
        localStorage.setItem("tenantDisplayName", getTenantDisplayName(activeTenant));
    }

    function renderCard(tenant, index, isActive) {
        var tenantDisplayName = getTenantDisplayName(tenant);
          var currentUserId = localStorage.getItem("loginUserId") || "";
        var tenantCreatedBy = tenant.createdBy || tenant.createdById || "";
        
        var canEdit = currentUserId && 
                    normalizeTenantName(tenantCreatedBy) === normalizeTenantName(currentUserId);
        return (
            '<button type="button" class="tenant-card' + (isActive ? ' active' : '') + '" data-tenant-index="' + index + '">' +

                '<div class="tenant-icon-wrapper" style="display:flex;align-items:center;gap:20px;">' +

                    '<span class="tenant-icon">' +
                        escapeHtml(getTenantInitials(tenantDisplayName)) +
                    '</span>' +
                   

                    '<span class="tenant-meta-group">' +
                        '<span class="tenant-name ellipsis-text">' +
                            escapeHtml(tenantDisplayName) +
                        '</span>' +
                    '</span>' +

                '</div>' +
                  '<span class="tenants-action">' + 
                        '<a href="#" class="tenant-copy-action" data-tenant-index="' + index + '" data-tooltip="Copy Tenant ID" aria-label="Copy tenant">' +
                            '<img src="./compliance/public/images/copy-icon.svg" alt="">' +
                        '</a>' +
                        (canEdit ?
                        '<a href="#" class="tenant-edit-action" data-tenant-index="' + index + '" data-tooltip="Edit tenant" aria-label="Edit tenant">' +
                            '<img src="./compliance/public/images/edit_icon.svg" alt="">' +
                        '</a>' : '') +
                        //  '<a href="#" class="tenant-delete-action">' +
                        //     '<img src="./compliance/public/images/delete.svg" alt="">' +
                        // '</a>' +
                    '</span>' +
                '<div class="tenant-members" style="display:flex;align-items:center;gap:5px;">' +
                   
                    '<span>' +
                        escapeHtml(getTenantMemberLabel(tenant)) +
                    '</span>' +

                    // '<img class="tenant-arrow" src="middleware/pub/server/ui/assets/img/side-arrow.svg" alt="">' +

                '</div>' +

            '</button>'
        );
    }

    var html = [];

    // Active tenant
    if (activeTenant) {
        html.push(renderCard(activeTenant, orderedTenants.indexOf(activeTenant), true));
    }

    // Divider
    html.push('<div class="tenant-divider"></div>');

    // Scrollable tenants
    html.push('<div class="tenant-scroll-list">');

    otherTenants.forEach(function (tenant) {
        html.push(renderCard(tenant, orderedTenants.indexOf(tenant), false));
    });

    html.push('</div>');

    // Divider
    html.push('<div class="tenant-divider"></div>');

    if (tenantCreationEnabled) {
        html.push(
            '<button type="button" id="create-tenant-btn" class="tenant-create-btnnew">' +
                '<img src="middleware/pub/server/ui/assets/img/Createtenants.svg" alt="">' +
                '<span>Create tenant</span>' +
            '</button>'
        );
    }

    list.innerHTML = html.join("");
    bindTenantTooltipPortals(list);

    Array.prototype.forEach.call(list.querySelectorAll(".tenant-card[data-tenant-index]"), function (button) {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            switchTenant(
                root,
                orderedTenants[Number(button.getAttribute("data-tenant-index"))],
                button
            );
        });
    });

        Array.prototype.forEach.call(list.querySelectorAll(".tenant-edit-action"), function (editAction) {
            editAction.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                openEditTenantModal(root, orderedTenants[Number(editAction.getAttribute("data-tenant-index"))]);
            });
        });

        Array.prototype.forEach.call(list.querySelectorAll(".tenant-copy-action"), function (copyAction) {
            copyAction.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                var tenant = orderedTenants[Number(copyAction.getAttribute("data-tenant-index"))];
                copyTenantText(getTenantSwitchName(tenant), copyAction);
            });
        });
        // ✅ Edit action mein copy call nahi honi chahiye
            Array.prototype.forEach.call(list.querySelectorAll(".tenant-edit-action"), function (editAction) {
                editAction.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    // ✅ Sirf edit karo - copyTenantText mat call karo
                    openEditTenantModal(root, orderedTenants[Number(editAction.getAttribute("data-tenant-index"))]);
                });
            });

        var createBtn = list.querySelector("#create-tenant-btn");

        if (createBtn) {
            createBtn.addEventListener("click", function (event) {
                event.stopPropagation();
                openCreateTenantModal(root);
            });
        }
        
}

function openCreateTenantModal(root) {

    if (document.getElementById("create-tenant-overlay")) {
        return;
    }

    var tenantId = "SL" + Date.now();

    var overlay = document.createElement("div");
    overlay.id = "create-tenant-overlay";

    overlay.innerHTML =
        '<div class="create-tenant-modal">' +

            '<div class="primary-header">' +
               '<div>' +
                        '<h4>Create tenant</h4>' +
                        '<h6> Create a new tenant to organize your projects, teams, and resources in one place.</h6>' +
               '</div>' +
                
                
                '<button type="button" class="close_primary close-create-tenant" data-bs-dismiss="modal" aria-label="Close">' +
                '<img src="./compliance/public/images/Close_round_duotone_line.svg" alt="">' +
                '</button>' +
            '</div>' +

            '<div class="create-tenant-body">' +

                '<div class="tenant-row">' +                    
                    '<input id="tenant-name-input" type="text" class="primary_input" placeholder="Enter tenant name">' +
                '</div>' +

                '<div id="create-tenant-error" style="display:none;margin:-18px 0 20px 0px;color:#ff1f1f;font-size:14px;align-items:center;gap:10px;">' +
                    '<span style="display:inline-flex;width:18px;height:18px;border:2px solid #ff1f1f;border-radius:50%;align-items:center;justify-content:center;font-size:12px;font-weight:700;line-height:1;">!</span>' +
                    '<span class="create-tenant-error-text"></span>' +
                '</div>' +

                '<div class="tenant-popupbtn">' +
                   '<button class="cancel-create-tenant btn-gry2">Cancel</button>' +
                    '<button id="create-tenant-submit" class="btn_primary">Create tenant</button>' +
                '</div>' +

            '</div>' +

        '</div>';

    document.body.appendChild(overlay);

    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
        overlay.classList.add("show");
    });

// Cancel Button
var cancelBtn = overlay.querySelector(".cancel-create-tenant");
if (cancelBtn) {
    cancelBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
       setTimeout(function(){
            overlay.remove();
         },500)
        overlay.classList.remove("show");
    });
}

// Close button (agar future me add karo)
var closeBtn = overlay.querySelector(".close-create-tenant");
console.log(closeBtn);
if (closeBtn) {
    closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();         
         overlay.classList.remove("show");
         setTimeout(function(){
            overlay.remove();
         },500)
    });
}

// Click outside modal
overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
        overlay.remove();
    }
});

    function showCreateTenantError(message) {
    var errorBox = overlay.querySelector("#create-tenant-error");
    var errorText = overlay.querySelector(".create-tenant-error-text");
    var input = overlay.querySelector("#tenant-name-input");

    errorText.textContent = message || "Unable to create tenant. Please try again.";
    errorBox.style.display = "flex";
    input.setAttribute("aria-invalid", "true");
    input.focus();
}
function closeModal() {
    overlay.classList.remove("show");

    setTimeout(function () {
        overlay.remove();
    }, 300); // CSS transition ke equal
}
function clearCreateTenantError() {
    var errorBox = overlay.querySelector("#create-tenant-error");
    var input = overlay.querySelector("#tenant-name-input");

    errorBox.style.display = "none";
    input.removeAttribute("aria-invalid");
}

function validateCreateTenantName() {
    var input = overlay.querySelector("#tenant-name-input");
    var submitButton = overlay.querySelector("#create-tenant-submit");
    var invalid = input.value.trim().length > 20;
    submitButton.disabled = invalid;
    if (invalid) {
        showCreateTenantError("Tenant name cannot exceed 20 characters.");
    } else {
        clearCreateTenantError();
    }
    return !invalid;
}

overlay.querySelector("#tenant-name-input").addEventListener("input", validateCreateTenantName);

overlay.querySelector("#create-tenant-submit").onclick = function () {
    var input = overlay.querySelector("#tenant-name-input");
    var submitButton = overlay.querySelector("#create-tenant-submit");
    var tenantName = input.value.trim();
    var authToken = localStorage.getItem("AuthToken") || "";
    var currentTenant = localStorage.getItem("loginTenant") || getStoredTenant() || "default";

    clearCreateTenantError();

    if (!validateCreateTenantName()) return;

    if (!tenantName) {
        showCreateTenantError("Please enter tenant name");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating...";

    window.fetch(API_BASE + "/tenant/" + encodeURIComponent(currentTenant) + "/packages.middleware.pub.tenant.createNewTenantForCurrentUser.main", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + authToken,
            "Content-Type": "application/json",
            "tenant": currentTenant
        },
        body: JSON.stringify({
            tenantName: tenantName
        })
    }).then(function (response) {
        return response.json();
    }).then(function (payload) {
        var createdSuccessfully = payload && (
            payload.status === true ||
            payload.message === "Done" ||
            payload.tenantName ||
            payload.displayName
        );

        if (payload && payload.tenantNameAvailable === false) {
            showCreateTenantError("This name is already in use. Please try another tenant name.");
            return;
        }

        if (!createdSuccessfully) {
            showCreateTenantError((payload && (payload.error || payload.message)) || "Unable to create tenant. Please try again.");
            return;
        }

        overlay.remove();

        swal({
            title: 'Tenant "' + tenantName + '" has been successfully created',
            text: "You are still using your current tenant.",
            type: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#2C61F5"
        }, function () {
            loadTenants(root);
            if (typeof loadTenantTable === "function") {
                loadTenantTable();
            }
        });
    }).catch(function () {
        showCreateTenantError("Unable to create tenant. Please try again.");
    }).finally(function () {
        if (document.body.contains(overlay)) {
            submitButton.disabled = false;
            submitButton.textContent = "Create";
        }
    });
};
}
window.openWorkspaceCreateTenantModal = function () {
    openCreateTenantModal(getExistingRoot());
};

function openEditTenantModal(root, tenant) {
    if (!tenant) {
        return;
    }

    var tenantId = tenant.tenantId || tenant.id || getTenantSwitchName(tenant);
    var currentName = getTenantDisplayName(tenant);
    var modal = document.getElementById("editTenantModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "editTenantModal";
        modal.className = "modal fade nw_popup";
        modal.setAttribute("tabindex", "-1");
        modal.setAttribute("aria-labelledby", "editTenantModalLabel");
        modal.innerHTML = '<div class="modal-dialog"><div class="modal-content" style="width: 700px">' +
            '<div class="primary-header">' +
            '<div>' +
            '<h4 id="editTenantModalLabel">Edit tenant</h4>' +
            '<h6> Create a new tenant to organize your projects, teams, and resources in one place.</h6>' +
            '</div>' +
            '<button type="button" class="close_primary" data-bs-dismiss="modal" aria-label="Close" style="margin-top: -25px"><img src="./compliance/public/images/Close_round_duotone_line.svg" alt=""></button></div>' +
            '<div class="modal-body"><div class="create-tenant-row primary_space">' +
            '<input class="primary_input" type="text" id="tenant-edit-name" placeholder="Enter name" value="">' +
            '<div id="tenant-edit-name-error" style="display:none;color:#ef4444;font-size:14px;">Tenant name cannot exceed 20 characters.</div></div>' +
            '</div>' +
            '<div class="modal-footer"><button type="button" class="btn-gry2" data-bs-dismiss="modal">Cancel</button>' +
            '<button type="button" class="btn_primary" id="tenant-edit-save-btn">Save</button></div></div></div>';
        document.body.appendChild(modal);
    }

    // Settings keeps this modal inside the Tenant tab. Move an existing modal
    // to the body as well, otherwise a hidden tab can also hide the modal.
    if (modal.parentNode !== document.body) {
        document.body.appendChild(modal);
    }

    var input = modal.querySelector("#tenant-edit-name");
    var submitButton = modal.querySelector("#tenant-edit-save-btn");
    input.value = currentName;
    // Tenant ID is retained in `tenantId` for the save request but is not shown.
    input.addEventListener("input", function () {
        var invalid = input.value.trim().length > 20;
        submitButton.disabled = invalid;
        modal.querySelector("#tenant-edit-name-error").style.display = invalid ? "block" : "none";
    });
    submitButton.onclick = function () {
        var tenantName = input.value.trim();
        var authToken = localStorage.getItem("AuthToken") || "";
        var currentTenant = localStorage.getItem("loginTenant") || getStoredTenant() || "default";

        if (tenantName.length > 20) {
            input.dispatchEvent(new Event("input"));
            return;
        }
        if (!tenantName) {
            if (typeof swal === "function") swal({ title: "Please enter tenant name.", type: "error", confirmButtonColor: "#f2533e" });
            return;
        }

        if (!tenantId) {
            if (typeof swal === "function") swal({ title: "Tenant ID is missing. Please refresh and try again.", type: "error", confirmButtonColor: "#f2533e" });
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        window.fetch(API_BASE + "/tenant/" + encodeURIComponent(currentTenant) + "/packages.middleware.pub.tenant.updateTenantForCurrentUser.main", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + authToken,
                "Content-Type": "application/json",
                "tenant": currentTenant
            },
            body: JSON.stringify({
                tenantName: tenantName,
                tenantId: tenantId
            })
        }).then(function (response) {
            return response.json();
        }).then(function (payload) {
            if (payload && payload.tenantNameAvailable === false) throw new Error("This name is already in use. Please try another tenant name.");
            if (!payload || payload.status !== true) throw new Error((payload && (payload.error || payload.message)) || "Unable to update tenant. Please try again.");

            if (window.jQuery) window.jQuery(modal).modal("hide");
            if (typeof loadTenantTable === "function") loadTenantTable();

            if (typeof swal === "function") {
                swal({
                    title: 'Tenant "' + tenantName + '" has been successfully updated',
                    type: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#2C61F5"
                }, function () {
                    loadTenants(root);
                });
            } else {
                loadTenants(root);
            }
        }).catch(function (error) {
            if (typeof swal === "function") swal({ title: "Tenant update failed", text: error.message || "Please try again.", type: "error", confirmButtonColor: "#f2533e" });
        }).finally(function () {
            submitButton.disabled = false;
            submitButton.textContent = "Save";
        });
    };
    // Settings loads Bootstrap 5 as well as the legacy Bootstrap 3 jQuery
    // plugin. Prefer the Bootstrap 5 API so the exact #editTenantModal is
    // consistently displayed on that page.
    if (window.bootstrap && window.bootstrap.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(modal).show();
    } else if (window.jQuery && window.jQuery.fn && typeof window.jQuery.fn.modal === "function") {
        window.jQuery(modal).modal("show");
    }
}
    function switchTenant(root, tenant, button) {
        var authToken = localStorage.getItem("AuthToken") || "";
        var currentTenant = localStorage.getItem("loginTenant") || getStoredTenant() || "default";
        var userId = getStoredUserId();
        var tenantName = getTenantSwitchName(tenant);
        var tenantDisplayName = getTenantDisplayName(tenant);

        if (!tenantName) {
            return;
        }

        if (tenantMatchesName(tenant, getStoredTenant())) {
            updateHeaderTenantName(root, tenantDisplayName);
            localStorage.setItem("tenantDisplayName", tenantDisplayName);
            closeTenantModal(root);
            return;
        }

        if (!window.fetch) {
            setTenantFeedback(root, "Tenant switching is not supported in this browser.", true);
            return;
        }

        if (button) {
            button.disabled = true;
        }

        setTenantFeedback(root, "Switching to " + tenantDisplayName + "...", false);

        window.fetch(API_BASE + "/tenant/switch", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + authToken,
                "Content-Type": "application/json",
                "tenant": currentTenant
            },
            body: JSON.stringify({
                token: authToken,
                tenant: currentTenant,
                userId: userId,
                targetTenant: tenantName,
                tenantId: tenant.tenantId,
                uuid: tenant.uuid
            })
        }).then(function (response) {
            if (!response.ok) {
                throw new Error("Tenant switch failed");
            }
            return response.json();
        }).then(function (payload) {
            if (!payload || payload.status !== "success" || !payload.token) {
                throw new Error((payload && payload.message) || "Tenant switch failed");
            }

            localStorage.setItem("AuthToken", payload.token);
            setStoredTenant(payload.tenant || tenantName, tenantDisplayName);
            updateHeaderTenantName(root, tenantDisplayName);

            if (payload.userId) {
                localStorage.setItem("loginUserId", payload.userId);
            }
            if (payload.tenantId !== undefined && payload.tenantId !== null && payload.tenantId !== "") {
                localStorage.setItem("tenantId", String(payload.tenantId));
            }
            if (payload.uuid) {
                localStorage.setItem("tenantUuid", payload.uuid);
            }

            if (/setting\.html$/.test(window.location.pathname)) {
                sessionStorage.setItem("tenant-settings-tab", "tenant");
            }
            window.location.href = "/middleware/pub/server/ui/workspace/web/dashboard.html?utm_source=Workspace&utm_medium=dashboard-page";
        }).catch(function () {
            if (button) {
                button.disabled = false;
            }
            setTenantFeedback(root, "We could not switch into that tenant right now. Please try again.", true);
        });
    }

    function loadTenants(root) {
        var authToken = localStorage.getItem("AuthToken") || "";
        var currentTenant = localStorage.getItem("loginTenant") || getStoredTenant() || "default";
        var userId = getStoredUserId();

        setTenantFeedback(root, "", false);
        setTenantLoading(root, "Loading tenants...", "Loading");

        if (!window.fetch) {
            renderTenantList(root, []);
            setTenantFeedback(root, "Tenant lookup is not supported in this browser.", true);
            return;
        }

        window.fetch(API_BASE + "/tenants", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + authToken,
                "Content-Type": "application/json",
                "tenant": currentTenant
            },
            body: JSON.stringify({
                token: authToken,
                tenant: currentTenant,
                userId: userId
            })
        }).then(function (response) {
            if (!response.ok) {
                throw new Error("Tenant lookup failed");
            }
            return response.json();
        }).then(function (payload) {
            if (payload && payload.userId) {
                localStorage.setItem("loginUserId", payload.userId);
            }
            renderTenantList(root, (payload && payload.tenants) || []);
        }).catch(function () {
            renderTenantList(root, []);
            setTenantFeedback(root, "Could not load tenants. Please refresh and try again.", true);
        });
    }

    function applyTenantCreationCapability(root, payload) {
            tenantCreationEnabled = String(payload && payload.isCoreVersion).toLowerCase() === "true";
            if (root._workspaceTenants) {
                renderTenantList(root, root._workspaceTenants);
            }
    }

    function getStoredSysInfo() {
        try {
            return JSON.parse(localStorage.getItem("SYNCLOOP_SYS_INFO") || "null");
        } catch (error) {
            return null;
        }
    }

    function loadTenantCreationCapability(root) {
        var storedSysInfo = getStoredSysInfo();
        if (storedSysInfo) {
            applyTenantCreationCapability(root, storedSysInfo);
            return;
        }
        document.addEventListener("syncloop:sysinfo", function () {
            var response = getStoredSysInfo();
            if (response) {
                applyTenantCreationCapability(root, response);
            }
        }, { once: true });
    }

    function loadCurrentUser(root) {
        loadTenantCreationCapability(root);
        if (typeof asyncRestRequest === "function") {
            asyncRestRequest("/packages.middleware.pub.service.getCurrentUserAccount.main", null, "GET", function (response) {
                updateHeaderProfile(root, response || {});
                loadTenants(root);
            });
            return;
        }

        if (typeof syncRestRequest === "function") {
            var result = syncRestRequest("/packages.middleware.pub.service.getCurrentUserAccount.main", "GET", "");
            if (result && result.status === 200 && result.payload) {
                updateHeaderProfile(root, JSON.parse(result.payload));
            } else {
                updateHeaderProfile(root, {});
            }
            loadTenants(root);
            return;
        }

        updateHeaderProfile(root, {});
        loadTenants(root);
    }

    function bindActions(root) {
        var trigger = root.querySelector("#workspace-profile-trigger");
        var card = root.querySelector("#workspace-profile-card");
        var closeButton = root.querySelector("#workspace-profile-close");
        var settingsAction = root.querySelector('[data-profile-action="settings"]');
        var workspaceAction = root.querySelector('[data-profile-action="workspace"]');
        var clearCacheAction = root.querySelector('[data-profile-action="clear-cache"]');
        var logoutAction = root.querySelector('[data-profile-action="logout"]');
        var tenantTrigger = root.querySelector("#workspace-tenant-trigger");
        var tenantModal = root.querySelector("#workspace-tenant-modal");
        var tenantClose = root.querySelector("#workspace-tenant-close");
        var tenantRefresh = root.querySelector("#workspace-tenant-refresh");

        if (!trigger || !card || !closeButton) {
            return;
        }

        trigger.addEventListener("click", function (event) {
            event.stopPropagation();
            closeTenantModal(root);
            card.classList.toggle("show");
        });

        closeButton.addEventListener("click", function (event) {
            event.stopPropagation();
            closeProfileCard(root);
        });

        card.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        if (tenantTrigger) {
            tenantTrigger.addEventListener("click", function (event) {
                event.stopPropagation();
                if (tenantModal && tenantModal.classList.contains("show")) {
                    closeTenantModal(root);
                } else {
                    openTenantModal(root);
                }
            });
        }

        if (tenantModal) {
            tenantModal.addEventListener("click", function (event) {
                event.stopPropagation();
            });
        }

        if (tenantClose) {
            tenantClose.addEventListener("click", function (event) {
                event.stopPropagation();
                closeTenantModal(root);
            });
        }

        if (tenantRefresh) {
            tenantRefresh.addEventListener("click", function (event) {
                event.stopPropagation();
                loadTenants(root);
            });
        }

        document.addEventListener("click", function (event) {
            var profileShell = root.querySelector(".profile-shell");
            var tenantShell = root.querySelector(".tenant-switcher");

            if (profileShell && !profileShell.contains(event.target)) {
                closeProfileCard(root);
            }
            if (tenantShell && !tenantShell.contains(event.target)) {
                closeTenantModal(root);
            }
        });

        if (settingsAction) {
            settingsAction.addEventListener("click", function () {
                window.location.href = SETTINGS_URL;
            });
        }

        if (workspaceAction) {
            workspaceAction.addEventListener("click", function () {
                window.location.href = WORKSPACE_URL;
            });
        }

        if (clearCacheAction) {
            clearCacheAction.addEventListener("click", function () {
                closeProfileCard(root);
                if (typeof clearCacheExceptAuth === "function") {
                    clearCacheExceptAuth();
                }
            });
        }

        if (logoutAction) {
            logoutAction.addEventListener("click", function () {
                closeProfileCard(root);
                if (typeof doLogout === "function") {
                    doLogout();
                }
            });
        }
    }

    function mountWorkspaceProfileHeader() {
        var existingRoot = getExistingRoot();
        var host = getHostElement();

        ensureTenantActionStyles();

        if (existingRoot && existingRoot.dataset.profileHeaderMounted !== "true") {
            existingRoot.dataset.profileHeaderMounted = "true";
            bindActions(existingRoot);
            updateHeaderTenantName(existingRoot, getStoredTenantDisplayName());
            loadCurrentUser(existingRoot);
            return;
        }

        if (!host || host.dataset.profileHeaderMounted === "true") {
            return;
        }

       host.dataset.profileHeaderMounted = "true";

var tempWrapper = document.createElement("div");
tempWrapper.innerHTML = HEADER_HTML;

var newRoot = tempWrapper.querySelector(".workspace-profile-root");

if (newRoot) {
    newRoot.style.opacity = "0";

    host.appendChild(newRoot);

    // data load hone ke baad show
    loadCurrentUser(newRoot);

    setTimeout(function () {
        var oldRoot = host.querySelector(".workspace-profile-root:not(:last-child)");

        if (oldRoot) {
            oldRoot.remove();
        }

        newRoot.style.opacity = "1";
    }, 300);
}
        if (!existingRoot) {
            return;
        }
        existingRoot.dataset.profileHeaderMounted = "true";
        bindActions(existingRoot);
        //updateHeaderProfile(existingRoot, {});
        loadCurrentUser(existingRoot);
    }

    function scheduleMounts() {
        mountWorkspaceProfileHeader();
        window.setTimeout(mountWorkspaceProfileHeader, 0);
        window.setTimeout(mountWorkspaceProfileHeader, 200);
    }

    document.addEventListener("syncloop:tenant-renamed", function (event) {
        var root = getExistingRoot();
        var detail = event.detail || {};
        if (!root) return;
        if (detail.active) updateHeaderTenantName(root, detail.displayName);
        loadTenants(root);
    });

    if (window.jQuery) {
        window.jQuery(scheduleMounts);
    } else {
        document.addEventListener("DOMContentLoaded", scheduleMounts);
    }

    window.addEventListener("load", mountWorkspaceProfileHeader);
})();
