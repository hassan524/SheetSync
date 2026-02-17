import UserInfo from "./UserInfo";
import BreadCrumbs from "./BreadCrumbs";

const Header = () => {
  return (
    <header className="bg-white">
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-6">
          <i className="bi bi-layout-sidebar-inset-reverse text-[#4B6A4F] text-2xl cursor-pointer"></i>
          <BreadCrumbs />
        </div>

        <div
          onClick={() => alert("Notifications clicked")}
          className="cursor-pointer hover:opacity-80 transition"
        >
          <UserInfo />
        </div>
      </div>
    </header>
  );
};

export default Header;
