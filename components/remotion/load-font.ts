import {continueRender, delayRender, staticFile} from 'remotion';

export const TheBoldFont = `TheBoldFont`;
export const MontserratFont = `Montserrat`;

let boldLoaded = false;
let montserratLoaded = false;

export const loadFont = async (): Promise<void> => {
	if (boldLoaded) {
		return Promise.resolve();
	}

	const waitForFont = delayRender();

	boldLoaded = true;

	const font = new FontFace(
		TheBoldFont,
		`url('${staticFile('theboldfont.ttf')}') format('truetype')`,
	);

	await font.load();
	document.fonts.add(font);

	continueRender(waitForFont);
};

export const loadMontserrat = async (): Promise<void> => {
	if (montserratLoaded) {
		return Promise.resolve();
	}

	const waitForFont = delayRender();

	montserratLoaded = true;

	const font = new FontFace(
		MontserratFont,
		`url('${staticFile('Montserrat/Montserrat-VariableFont_wght.ttf')}') format('truetype')`,
		{
			// This enables variable font weight support
			weight: '100 900',
		}
	);

	await font.load();
	document.fonts.add(font);

	continueRender(waitForFont);
};
