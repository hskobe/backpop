/* 
    settings.js

    This file gets injected into the config/settings page and handles
    the various interactive aspects of the page

    written by Tom Wagg
    edited by Hannah Skobe

*/

// once the page loads, run this function
document.addEventListener("DOMContentLoaded", function() {
    // hide the dummy maths element
    document.getElementById("hide-this-maths").classList.add("hide-me");

    // show/hide options any time the expander is clicked (and switch up/down arrow)
    document.querySelectorAll(".options-expander").forEach(expander => {
        expander.addEventListener("click", function() {
            expander.parentElement.querySelector(".options").classList.toggle("hide");
            expander.querySelector(".fa").classList.toggle("fa-chevron-down");
            expander.querySelector(".fa").classList.toggle("fa-chevron-up");
        });
    });

    // make it so that checkbox labels can also be clicked instead of just the tiny box
    document.querySelectorAll(".col-3 label").forEach(label => {
        label.addEventListener("click", function() {
            label.parentElement.querySelector("input").click();
        });
    });

    // hide the dummy headings that are just for the toc (please don't judge my hack haha)
    document.querySelectorAll("h3:not(.setting-group-title)").forEach(h3 => {
        let my_headings = document.querySelectorAll("h2.setting-group-title");
        for (let heading of my_headings) {
            if (heading.innerText == h3.innerText) {
                h3.style = "height: 0; margin: 0; overflow: hidden;";
                break;
            }
        }
    });

    // hack the TOC on the right to include the subheadings from ANY category that uses .settings-section subcategories
    const lis = document.querySelectorAll(".toc-drawer li");
    for (let li of lis) {
        const matching_cards = document.querySelectorAll(".card.setting-card");
        let matching_card = null;
        for (let card of matching_cards) {
            const header = card.querySelector(".setting-group-title");
            if (header && header.innerText.trim().toLowerCase() == li.innerText.trim().toLowerCase()) {
                matching_card = card;
                break;
            }
        }
        if (!matching_card) continue;

        // only that card's own subsections (not every subsection on the page)
        const subheadings = matching_card.querySelectorAll(".settings-section h2");
        if (subheadings.length == 0) continue;

        const new_ul = document.createElement("ul");
        for (let subheading of subheadings) {
            const new_li = document.createElement("li");
            new_li.innerHTML = `<a class="reference internal" href="#${subheading.id}">${subheading.innerText}</a>`;
            new_ul.appendChild(new_li);
        }
        li.appendChild(new_ul);
    }

    // update hidden inputs based on the checkbox choices anytime one of them in a group is clicked
    document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        checkbox.addEventListener("change", function() {
            const checked = checkbox.parentElement.parentElement.querySelectorAll("input[type='checkbox']");
            value = "[]";
            if (checked.length > 0) {
                value = "[";
                for (let check of checked) {
                    if (check.checked) {
                        value += `${check.value}, `;
                    }
                }
                value = value == "[" ? "[]" : value.slice(0, -2) + "]";
            }
            checkbox.parentElement.parentElement.querySelector("input.hide-me").value = value;
        });
    });

    document.querySelectorAll(".setting-chooser").forEach(chooser => {
        if (chooser.querySelector(".col-9 h3.name").innerText == "sampling_method") {
            chooser.querySelector(".form-control").addEventListener("change", function() {

                // find the relevant settings to show/hide based on the sampling method
                const setting_names = ["primary_model", "porb_model", "ecc_model",
                                       "qmin", "m2_min", "binfrac_model"];

                // get the elements that match these names
                const all_sampling_settings = this.parentElement.parentElement.parentElement.parentElement.children;
                let relevant_settings = [];
                console.log(all_sampling_settings)
                for (let setting of all_sampling_settings) {
                    console.log(setting.querySelector(".name"))
                    if (setting_names.includes(setting.querySelector(".name").innerText)) {
                        relevant_settings.push(setting);
                    }
                }

                // show settings
                if (this.value == "independent") {
                    for (let setting of relevant_settings) {
                        setting.classList.remove("hide-me");
                    }
                }
                // hide settings
                else if (this.value == "multidim") {
                    for (let setting of relevant_settings) {
                        setting.classList.add("hide-me");
                    }
                }
            })
        }
    });

    // reconstruct the interactive files any time any input changes
    document.querySelectorAll(".form-control").forEach(input => {
        input.addEventListener("change", function() {
            construct_files()
        });
    });

    // setup the toggle button for including comments in the ini file
    document.getElementById("ini-file-comments").addEventListener("click", function() {
        this.classList.toggle("active");
        this.innerText = this.classList.contains("active") ? "Hide Comments" : "Show Comments";
        construct_files();
    });

    // construct the files once everything is loaded in
    construct_files();
});


function construct_files() {
    // construct the strings for the INI file
    // the span tags are to match the syntax highlighting for pygments
    let ini_file = "<span class='c1'>; BackPop INI file\n</span>"

    // whether the user wanted to include comments
    const include_comments = document.getElementById("ini-file-comments").classList.contains("active");

    // go through every single input on the page
    const els = document.querySelectorAll(".setting-card, .settings-section, .form-control");
    for (let el of els) {
        if (el.classList.contains("setting-card")) {
            // track once you reach BSE settings
            if (el.getAttribute("data-category") == "bse") {
                reached_bse = true;
            }
            ini_file += `<span class='k'>\n[${el.getAttribute("data-category")}]\n</span>`;
        } else if (el.classList.contains("settings-section")) {
            // add any subheadings (e.g. "Stellar Winds")
            subheading = el.querySelector("h2").innerText;
            ini_file += '<span class="c1">\n;;;;' + ';'.repeat(subheading.length) + ';;;;\n</span>';
            ini_file += `<span class="c1">;;; ${subheading} ;;;\n</span>`;
            ini_file += '<span class="c1">;;;;' + ';'.repeat(subheading.length) + ';;;;\n</span>';
        } else if (el.classList.contains("form-control")) {
            const full_setting = el.parentElement.parentElement.parentElement;
            // add the comments if the user wants them
            if (include_comments) {
                ini_file += `<span class="c1">\n; ${full_setting.querySelector(".name").innerText}\n</span>`;

                // include the description as a comment
                description = full_setting.querySelector(".description").innerText.replaceAll('\n', '');
                ini_file += `<span class="c1">; ${description}\n</span>`;

                // include the options-preface as a comment
                options_preface = full_setting.querySelector(".options-preface");
                if (options_preface && options_preface.innerText != "") {
                    ini_file += `<span class='c1'>; ${options_preface.innerText.replaceAll('\n', '')}\n</span>`;
                }

                // include the options as a comment
                options = full_setting.querySelectorAll("li");
                if (options.length > 0) {
                    ini_file += "<span class='c1'>; Options: \n";
                    for (let option of options) {
                        ini_file += `<span class='c1'>;    ${option.innerText.replaceAll('\n', '')}\n`;
                    }
                    ini_file += "</span>";
                }

                // include the default value as a comment
                default_value = full_setting.querySelector(".default").innerText;
                ini_file += `<span class="c1">; ${default_value}\n</span>`;
            }

            // add the settings to the ini file
            label = full_setting.querySelector(".name").innerText;
            value = el.value;
            ini_file += `<span class="na">${label}</span><span class="na"> = </span><span class="s">${value}\n</span>`;

        }
    }

    // update the actual values on the page with the constructed strings
    document.querySelector("#ini-file .highlight-ini pre").innerHTML = ini_file;
}
