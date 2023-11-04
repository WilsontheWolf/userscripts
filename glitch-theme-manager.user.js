// ==UserScript==
// @name        Glitch Theme Manager
// @namespace   https://shorty.systems
// @match       https://preview.glitch.com/*
// @version     1.0
// @author      WilsontheWolf
// @description A (probably over engineered) theme engine for the glitch preview site.
// @downloadURL https://raw.githubusercontent.com/WilsontheWolf/userscripts/master/glitch-theme-manager.user.js
// @grant GM.addStyle
// @grant GM.registerMenuCommand
// @grant GM.unregisterMenuCommand
// @grant GM.getValue
// @grant GM.setValue
// ==/UserScript==

let style;
let disabled;
let selectedTheme;

// Want to add a custom theme? Add it to the themeData object below.
const themeData = {
    hotdog: {
        name: "Hotdog Stand",
        author: "WilsontheWolf",
        colours: {
            background: "#ffff00",
            pageBackground: "#ff0000",
            borderSolid: "#ffff00",
            contentBackground: "#ffff00",
            link: "#5912d8",
            linkHover: "#350b84",
            linkDark: "black",
            linkDarkHover: "#ff0000",
            heading: "black",
            text: "black",
            buttonPrimary: "#ffa700",
        }
    },
    purply: {
        name: "Purply",
        author: "WilsontheWolf",
        colours: {
            background: "blueviolet",
            pageBackground: "purple",
            borderSolid: "blueviolet",
            contentBackground: "blueviolet",
            link: "#a16cff",
            linkHover: "#824fe1",
            linkDark: "#efefc0",
            linkDarkHover: "#01fd58",
            heading: "#fef8f8",
            text: "#fff5aa",
            buttonPrimary: "#0010ff",
        }
    }
};

const cssNames = {
    background: "--color-background",
    pageBackground: "--color-page-background",
    borderSolid: "--color-border-solid",
    contentBackground: "--color-content-background",
    link: "--color-link",
    linkHover: "--color-link-hover",
    linkDark: "--color-link-dark",
    linkDarkHover: "--color-link-dark-hover",
    heading: "--color-heading",
    text: "--color-text",
    buttonPrimary: "--color-button-primary",
};

const commandData = {
    toggle: {
        display: "Toggle",
        func: async () => {
            disabled = !disabled;
            if (disabled) removeStyle();
            else doStyle();
            await GM.setValue("disabled", disabled);
            commandData.toggle.display = disabled ? "Enable" : "Disable"
            handleCommands();
        },
        autoclose: false,
        hover: "Enable/disable the custom themes",
    }
};

(async () => {
    disabled = await GM.getValue("disabled");
    selectedTheme = await GM.getValue("theme") || "hotdog";
    if (!themeData[selectedTheme]) selectedTheme = "hotdog";

    if (!disabled)
        doStyle();

    commandData.toggle.display = disabled ? "Enable" : "Disable";
    processThemeCommands();
    handleCommands();
})();


function processThemeCommands() {
    const themes = Object.entries(themeData);
    themes.forEach(([key, data]) => {
        const id = `customTheme_${key}`;
        if (!commandData[id]) {
            commandData[id] = {
                display: `${selectedTheme === key ? "✅ " : ""}${data.name || key}`,
                func: async () => {
                    selectedTheme = key;
                    if (!disabled) doStyle();
                    processThemeCommands();
                    handleCommands();
                    await GM.setValue("theme", key);
                },
                autoclose: false,
                hover: `A theme by ${data.author || "a mysterious person"}`,
            };
        } else {
            commandData[id].display = `${selectedTheme === key ? "✅ " : ""}${data.name || key}`
        }
    });
}

let registeredCommands = [];
function handleCommands() {
    let newRegisters = [];
    Object.entries(commandData).forEach(([id, data = {}]) => {
        newRegisters.push(id);
        GM.registerMenuCommand(data.display || id, data.func, { id, title: data.hover, autoClose: data.autoclose })
    });
    registeredCommands.forEach(id => {
        if (!newRegisters.includes(id)) GM.unregisterMenuCommand(id);
    })
    registeredCommands = newRegisters;
}

function doStyle() {
    removeStyle();
    const theme = themeData[selectedTheme];


    style = GM.addStyle(`
  :root {
    ${Object.entries(theme.colours || {}).map(([name, val]) => {
        const cssName = cssNames[name];
        if (!cssName || !val) return "";
        return `${cssName}: ${val};`;
    }).join('\n')}
  }
  `);
}


function removeStyle() {
    style?.parentElement?.removeChild?.(style);
}

// Sometimes, the site completely replaces the entire dom
// This catches that and reapplies the theme
const observer = new MutationObserver((changes) => {
    changes.forEach((c) => {
        c?.addedNodes?.forEach((n) => {
            if (n === unsafeWindow.document.documentElement) {
                doStyle();
            }
        });
    });
});

observer.observe(unsafeWindow.document, { childList: true });
