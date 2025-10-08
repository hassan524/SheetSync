
type HeaderColumn = {
  Subheading?: string;
  SubHeadingIcon1?: string;
  SubHeadingIcon2?: string;
  background: string;
  width: string;
};

const headerData: HeaderColumn[] = [
  { width: "4", background: "#FFFFFF" },
  {
    Subheading: "Financial Overview",
    SubHeadingIcon1: "bi bi-link",
    SubHeadingIcon2: "bi bi-arrow-repeat",
    background: "#E2E2E2",
    width: "46",
  },
  { width: "10", background: "#FFFFFF" },
  {
    Subheading: "ABC",
    SubHeadingIcon1: "bi bi-download",
    SubHeadingIcon2: "bi bi-three-dots",
    background: "#D2E0D4",
    width: "10",
  },
  {
    Subheading: "Answer a question",
    SubHeadingIcon1: "bi bi-download",
    SubHeadingIcon2: "bi bi-three-dots",
    background: "#DCCFFC",
    width: "20",
  },
  {
    Subheading: "Extract",
    SubHeadingIcon1: "bi bi-download",
    SubHeadingIcon2: "bi bi-three-dots",
    background: "#FAC2AF",
    width: "10",
  },
  {
    SubHeadingIcon1: "bi bi-plus-lg",
    background: "#FFFFFF",
    width: "10",
  },
];

const SubHeader = () => {
  const checkstyle = (col: HeaderColumn) => col.Subheading === "Financial Overview";
  const isPlusIcon = (col: HeaderColumn) => col.SubHeadingIcon1 === "bi bi-plus-lg";
  const isABC = (col: HeaderColumn) => col.Subheading === "ABC";

  return (
    <div className="border-t border-[#EEEEEE] w-max min-w-full flex">
      {headerData.map((col: HeaderColumn, i: number) => (
        <div
          key={i}
          className={`flex items-center ${
            checkstyle(col) ? "justify-start" : "justify-center"
          }`}
          style={{
            background: col.background || "#FFFFFF",
            width: `${col.width}vw`,
            height: "40px",
            borderRight: "1px solid #F6F6F6",
            padding: "5px 8px",
            fontSize: "14px",
            color: "#333",
            flexShrink: 0,
            boxSizing: "border-box",
            gap: "10px",
          }}
        >
          <div
            className={`flex items-center gap-[10px] ${
              checkstyle(col)
                ? "bg-[#EEEEEE] px-2 py-[2px] rounded"
                : "justify-center"
            }`}
          >
            {col.SubHeadingIcon1 && (
              <i
                className={`${col.SubHeadingIcon1} ${
                  isABC(col)
                    ? "text-[#A3ACA3]"
                    : isPlusIcon(col)
                    ? "text-black text-lg"
                    : checkstyle(col)
                    ? "text-[#2892FE] text-lg"
                    : "text-slate-100"
                }`}
              />
            )}
            {col.Subheading && <span>{col.Subheading}</span>}
          </div>

          {col.SubHeadingIcon2 && (
            <i
              className={`${col.SubHeadingIcon2} ${
                checkstyle(col)
                  ? "text-[#F48561] text-lg hover:animate-spin cursor-pointer"
                  : "text-[#A3ACA3]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default SubHeader;
