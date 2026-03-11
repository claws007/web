import { standardizeLocale } from "@/utils/locale";
import { type Plugin } from "vue";
import { createI18n } from "vue-i18n";

const getBrowserLocale = () => {
	const navigatorLocale = navigator.language || navigator.languages[0];
	return standardizeLocale(navigatorLocale);
};
export const browserLocale = getBrowserLocale();
// const defaultLocale = useLocalStorage<typeof browserLocale>(
//   StorageKey.locale,
//   browserLocale,
// )
console.log("browserLocale: ", browserLocale);
// console.log("defaultLocale: ", defaultLocale.value)
const _i18nPlugin = createI18n({
	legacy: false,
	locale: browserLocale,
	fallbackLocale: browserLocale,
	// messages: JSON.parse(JSON.stringify(locales)),
});
export const i18nPlugin = ((app) => {
	app.use(_i18nPlugin);
}) as Plugin;
