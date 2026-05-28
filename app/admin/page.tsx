import Script from "next/script";

export default function AdminPage() {
  return (
    <>
      <main className="min-h-screen bg-black text-white overflow-x-hidden">
        <section className="grid min-h-screen xl:grid-cols-[0.8fr_1.2fr]">
          <aside className="border-b border-[#ffffff26] p-6 sm:p-12 xl:border-b-0 xl:border-r">
            <a href="/" className="text-base font-bold tracking-[0.08em]">JelleWijma</a>
            <h1 className="mt-10 text-5xl font-bold leading-none sm:text-7xl">Admin</h1>
            <p id="admin-status" className="mt-6 leading-7 text-[#ffffffb3]">Sign in to manage gallery photos and projects.</p>
            <button type="button" id="logout-button" className="mt-8 hidden border border-[#ffffff40] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffffffcc] transition hover:border-white hover:text-white">Log out</button>
          </aside>
          <div className="p-6 sm:p-12">
            <form id="login-form" className="max-w-xl">
              <label className="block">
                <span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Email</span>
                <input type="email" id="admin-email" autoComplete="email" required className="mt-3 w-full border border-[#ffffff40] bg-black px-4 py-3 text-white" />
              </label>
              <button type="submit" className="mt-6 border border-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">Send link</button>
            </form>
            <div id="admin-panel" className="hidden space-y-12">
              <section className="border-b border-[#ffffff26] pb-12">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-3xl font-bold">Gallery photos</h2>
                  <button type="button" id="photo-add" className="border border-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">Add image</button>
                </div>
                <form id="photo-form" className="mt-6 hidden gap-4 border border-[#ffffff26] p-4 sm:p-6">
                  <input type="hidden" id="photo-id" />
                  <label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Title</span><input id="photo-title" required className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label>
                  <label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Alt text</span><input id="photo-alt" required className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Category</span><select id="photo-category" className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3"><option value="car">Car</option><option value="landscape">Landscape</option><option value="street">Street</option></select></label>
                    <label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Order</span><input id="photo-order" type="number" defaultValue="0" className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label>
                    <label className="flex items-end gap-3 pb-3"><input id="photo-published" type="checkbox" defaultChecked /><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Published</span></label>
                  </div>
                  <label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Image</span><input id="photo-file" type="file" accept="image/*" className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label>
                  <div className="flex flex-wrap gap-3"><button type="submit" className="border border-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">Save image</button><button type="button" id="photo-reset" className="border border-[#ffffff40] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffffffcc]">Cancel</button></div>
                </form>
                <div id="photo-list" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" />
              </section>
              <section className="border-b border-[#ffffff26] pb-12">
                <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-3xl font-bold">Home page images</h2></div>
                <form id="home-image-form" className="mt-6 hidden gap-4 border border-[#ffffff26] p-4 sm:p-6">
                  <input type="hidden" id="home-image-slot" />
                  <div><p id="home-image-label" className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Home image</p><h3 id="home-image-heading" className="mt-2 text-2xl font-semibold">Change image</h3></div>
                  <label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Title</span><input id="home-image-title" required className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label>
                  <label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Alt text</span><input id="home-image-alt" required className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label>
                  <label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Image</span><input id="home-image-file" type="file" accept="image/*" className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label>
                  <div className="flex flex-wrap gap-3"><button type="submit" className="border border-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">Save image</button><button type="button" id="home-image-reset" className="border border-[#ffffff40] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffffffcc]">Cancel</button></div>
                </form>
                <div id="home-image-list" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" />
              </section>
              <section>
                <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-3xl font-bold">Projects</h2><button type="button" id="project-add" className="border border-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">Add project</button></div>
                <form id="project-form" className="mt-6 hidden gap-4 border border-[#ffffff26] p-4 sm:p-6"><input type="hidden" id="project-id" /><label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Title</span><input id="project-title" required className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label><label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Description</span><textarea id="project-description" rows={4} required className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">URL</span><input id="project-url" type="url" required className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label><label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Image alt</span><input id="project-image-alt" required className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label></div><div className="grid gap-4 sm:grid-cols-3"><label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Order</span><input id="project-order" type="number" defaultValue="0" className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label><label className="flex items-end gap-3 pb-3"><input id="project-featured" type="checkbox" defaultChecked /><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Featured</span></label><label className="flex items-end gap-3 pb-3"><input id="project-published" type="checkbox" defaultChecked /><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Published</span></label></div><label className="block"><span className="text-sm uppercase tracking-[0.2em] text-[#ffffff99]">Image</span><input id="project-file" type="file" accept="image/*" className="mt-2 w-full border border-[#ffffff40] bg-black px-4 py-3" /></label><div className="flex flex-wrap gap-3"><button type="submit" className="border border-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">Save project</button><button type="button" id="project-reset" className="border border-[#ffffff40] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffffffcc]">Cancel</button></div></form>
                <div id="project-list" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" />
              </section>
            </div>
          </div>
        </section>
      </main>
      <Script src="/assets/js/runtime-config.js" strategy="afterInteractive" />
      <Script src="/assets/js/admin.js" strategy="afterInteractive" />
    </>
  );
}
