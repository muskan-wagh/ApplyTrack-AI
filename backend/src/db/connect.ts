import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
