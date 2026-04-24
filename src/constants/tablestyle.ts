const getBlockStyle = (colId: string) => {
  switch (colId) {
    case "1":
      return {
        backgroundColor: "#E2E2E2",
        fontWeight: "bold",
        textAlign: "center",
      };
    case "2":
      return {
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid #F6F6F6",
        borderRight: "1px solid #F6F6F6",
      };
    case "3":
      return {
        backgroundColor: "#D2E0D4",
        fontStyle: "italic",
        borderLeft: "1px solid #F6F6F6",
        borderRight: "1px solid #F6F6F6",
      };
    case "4":
      return {
        backgroundColor: "#DCCFFC",
      };
    case "5":
      return {
        backgroundColor: "#FFE9E0",
        color: "#222",
        borderLeft: "1px solid #F6F6F6",
        borderRight: "1px solid #F6F6F6",
      };
    case "rowIndex":
      return {
        backgroundColor: "#FFFFFF",
      };
    default:
      return {
        backgroundColor: "#FFFFFF",
      };
  }
};

const getCellStyle = (key: string, disableBorder = false) => {
  const baseStyle: any = {
    padding: "5px 8px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
    width: '10vw'
  };

  if (!disableBorder) {
    baseStyle.border = "1px solid #F6F6F6";
  }

  if (key === "rowIndex") {
    return {
      ...baseStyle,
      width: "4vw",
    };
  }

  // if (key === "Job Request") {
  //   return {
  //     ...baseStyle,
  //     width: "16vw",
  //   };
  // }

  return {
    ...baseStyle,
    width: "10vw",
  };
};

export { getCellStyle, getBlockStyle };
