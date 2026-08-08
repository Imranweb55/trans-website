/* Trans Infra Group — Careers application form
   Renders role-specific questions and hands the completed application
   off to WhatsApp as a pre-filled message. No backend / data storage. */
(function () {
  "use strict";

  // Update this to the hiring desk's WhatsApp number (country code, no + or spaces).
  var HIRING_WHATSAPP_NUMBER = "918939978887";

  var ROLE_QUESTIONS = {
    Driver: [
      {
        id: "licenseNo",
        label: "Driving License Number",
        type: "text",
        required: true,
      },
      {
        id: "vehicleExp",
        label: "Vehicle Experience",
        type: "text",
        placeholder: "e.g. Trailers, tippers, hydraulic axles",
      },
      {
        id: "heavyVehicleExp",
        label: "Heavy Vehicle Experience (years)",
        type: "number",
      },
      {
        id: "routeExp",
        label: "Route Experience",
        type: "text",
        placeholder: "e.g. NH corridors, states covered",
      },
    ],
    "Logistics Coordinator": [
      {
        id: "erpExp",
        label: "ERP Experience",
        type: "text",
        placeholder: "e.g. SAP, Tally, custom ERP",
      },
      {
        id: "warehouseExp",
        label: "Warehouse Experience (years)",
        type: "number",
      },
      { id: "inventoryExp", label: "Inventory Experience", type: "text" },
    ],
    "Sales Executive": [
      { id: "salesExp", label: "Sales Experience (years)", type: "number" },
      {
        id: "industryExp",
        label: "Industry Experience",
        type: "text",
        placeholder: "e.g. Logistics, EPC, manufacturing",
      },
      {
        id: "clientHandlingExp",
        label: "Client Handling Experience",
        type: "text",
      },
    ],
    "Operations Manager": [
      { id: "teamSize", label: "Team Size Managed", type: "number" },
      { id: "opsExp", label: "Operations Experience (years)", type: "number" },
      { id: "supplyChainExp", label: "Supply Chain Experience", type: "text" },
    ],
    Other: [
      {
        id: "otherDetails",
        label: "Tell us about your relevant experience",
        type: "textarea",
      },
    ],
  };

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("careerApplyForm");
    if (!form) return;

    var roleSelect = document.getElementById("applyRole");
    var roleQuestionsWrap = document.getElementById("roleQuestions");

    roleSelect.addEventListener("change", function () {
      renderRoleQuestions(roleSelect.value);
    });

    function renderRoleQuestions(role) {
      roleQuestionsWrap.innerHTML = "";
      var questions = ROLE_QUESTIONS[role] || [];
      if (!questions.length) return;

      var heading = document.createElement("div");
      heading.className = "col-12";
      heading.innerHTML =
        '<hr class="my-1"><p class="fw-bold mb-0">' +
        role +
        " — a few quick questions</p>";
      roleQuestionsWrap.appendChild(heading);

      questions.forEach(function (q) {
        var col = document.createElement("div");
        col.className = q.type === "textarea" ? "col-12" : "col-md-6";

        var label = document.createElement("label");
        label.className = "form-label";
        label.setAttribute("for", q.id);
        label.textContent = q.label;

        var field;
        if (q.type === "textarea") {
          field = document.createElement("textarea");
          field.rows = 3;
          field.className = "form-control";
        } else {
          field = document.createElement("input");
          field.type = q.type === "number" ? "number" : "text";
          field.className = "form-control";
        }
        field.id = q.id;
        field.name = q.id;
        if (q.placeholder) field.placeholder = q.placeholder;
        if (q.required) field.required = true;

        col.appendChild(label);
        col.appendChild(field);
        roleQuestionsWrap.appendChild(col);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var role = roleSelect.value;
      var lines = [];
      lines.push("Name: " + val("applyName"));
      lines.push("Phone: " + val("applyPhone"));
      lines.push("Email: " + val("applyEmail"));
      lines.push("City: " + val("applyCity"));
      lines.push("Qualification: " + val("applyQualification"));
      lines.push("Experience: " + val("applyExperience") + " years");
      lines.push("Applied Role: " + role);

      var questions = ROLE_QUESTIONS[role] || [];
      if (questions.length) {
        lines.push("");
        lines.push("Role-specific Questions:");
        questions.forEach(function (q) {
          var answer = val(q.id);
          if (answer) lines.push(q.label + ": " + answer);
        });
      }

      lines.push("");
      lines.push("Interested in joining Trans Infra Group.");

      var message = encodeURIComponent(lines.join("\n"));
      var waUrl =
        "https://wa.me/" + HIRING_WHATSAPP_NUMBER + "?text=" + message;
      window.open(waUrl, "_blank", "noopener");
    });

    function val(id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    }
  });
})();
