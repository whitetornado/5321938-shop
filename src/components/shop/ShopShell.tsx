import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { getSettings } from "@/lib/products";
import { publicShipping } from "@/lib/config";

export async function ShopShell({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      {settings.announcement && (
        <div className="bg-ink px-4 py-2 text-center text-[13px] font-medium text-white">
          {settings.announcement}
        </div>
      )}
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer shipping={publicShipping()} shopOpen={settings.shop_open} />
    </>
  );
}
