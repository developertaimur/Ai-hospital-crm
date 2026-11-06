export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "lci-theme";

/** Inline boot script — keep in sync with THEME_STORAGE_KEY. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}}catch(e){}})();`;
