import { create } from 'svg-captcha';
import sharp from 'sharp';

export interface GeneratedCaptcha {
  imageBuffer: Buffer;
  answer: string;
}

/** Renders a noisy 5-digit numeric captcha as a PNG buffer, ready to send via sendPhoto. */
export async function generateCaptcha(): Promise<GeneratedCaptcha> {
  const { data: svg, text } = create({
    size: 5,
    noise: 4,
    charPreset: '0123456789',
    width: 220,
    height: 110,
    fontSize: 60,
  });

  const imageBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return { imageBuffer, answer: text };
}
