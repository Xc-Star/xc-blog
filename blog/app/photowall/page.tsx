import { siteConfig } from "../../siteConfig";
import PhotoWallClient from "./PhotoWallClient";

export async function generateMetadata() {
  return {
    title: "照片墙 | " + siteConfig.title,
  };
}

export default function PhotoWallPage() {
  return <PhotoWallClient />;
}