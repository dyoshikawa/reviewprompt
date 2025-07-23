import clipboardy from "clipboardy";

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await clipboardy.write(text);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to copy to clipboard: ${error.message}`);
    }
    throw new Error("Failed to copy to clipboard");
  }
}
