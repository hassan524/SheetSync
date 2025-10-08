const UserInfo = () => {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-slate-50 flex gap-2 items-center rounded-sm py-[11px] px-3">
        <div className="h-full w-[10%]">
          <i className="bi bi-search text-slate-300"></i>
        </div>
        <input
          type="text"
          placeholder="Search within sheet"
          className="outline-none w-[90%] overflow-hidden text-sm"
        />
      </div>

      <div className="relative">
        <i className="bi bi-bell text-gray-500 text-2xl"></i>
        <span className="absolute -top-1 -right-1 bg-[#4B6A4F] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
          2
        </span>
      </div>
      <div className="flex items-center gap-3 px-3 py-1 rounded-md hover:bg-gray-100 transition cursor-pointer">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
          <img
            src="/download.jpg"
            alt="User profile"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-800">John Doe</span>
          <span className="text-xs text-gray-500 truncate max-w-[120px]">
            John.Doe@example.com
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
