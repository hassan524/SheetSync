import BreadCrumbs from "./BreadCrumbs";

const Header = () => {
  return (
    <header className="bg-white border-0">
      <div className="h-12 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="bi bi-layout-sidebar-inset-reverse text-gray-700 text-xl cursor-pointer"></i>
          <BreadCrumbs />
        </div>
        <div className="text-sm text-gray-600">User</div>
      </div>
    </header>
  );
};

export default Header;

