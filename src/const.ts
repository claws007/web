export const themeHSColorS = 50;
export const themeHSColorL = 80;
export const themeHSColorSString = `${themeHSColorS}%`;
export const themeHSColorLString = `${themeHSColorL}%`;
export function themeHSL(h: string | number, a = 1) {
	return `hsla(${h}, ${themeHSColorSString}, ${themeHSColorLString}, ${a})`;
}

export const taskScheduleHSColorS = themeHSColorS;
export const taskScheduleHSColorL = themeHSColorL;
export const taskScheduleHSColorA = 1;

export const taskScheduleHSColorSString = `${taskScheduleHSColorS}%`;
export const taskScheduleHSColorLString = `${taskScheduleHSColorL}%`;
export const taskScheduleHSColorAString = `${taskScheduleHSColorA}`;

export const defaultPrimaryHue = "221";
