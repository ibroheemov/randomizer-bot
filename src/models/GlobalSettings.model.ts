import { Document, Schema, model } from 'mongoose';

export interface GlobalSettingsDocument extends Document {
  key: string;
  globalChannelsEnabled: boolean;
}

const globalSettingsSchema = new Schema<GlobalSettingsDocument>({
  key: { type: String, required: true, unique: true },
  globalChannelsEnabled: { type: Boolean, default: false },
});

export const GlobalSettings = model<GlobalSettingsDocument>('GlobalSettings', globalSettingsSchema);
