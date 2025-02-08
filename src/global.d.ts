import { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}
interface ImportMetaEnv {
  readonly VITE_LCTOKEN: string;
  readonly VITE_LCTGOVERNANCE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
