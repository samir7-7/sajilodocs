import React from "react";
import { FileText, Folder, Image, MoreVertical } from "lucide-react";

const FileCard = ({ name, type, selected }) => {
  const getIcon = () => {
    switch (type) {
      case "folder":
        return (
          <Folder size={48} color="#5f6368" fill="#5f6368" fillOpacity={0.2} />
        );
      case "image":
        return <Image size={48} color="#d93025" />;
      default:
        return <FileText size={48} color="#1967d2" />;
    }
  };

  return (
    <div
      className={`bg-white rounded-xl p-3 cursor-pointer border border-transparent hover:bg-hover-bg hover:shadow-sm transition-all flex flex-col h-[200px] ${
        selected ? "bg-[#e8f0fe] border-[#1967d2]" : "bg-[#f0f4f9]"
      }`}
    >
      <div className="flex items-center justify-between mb-3 text-secondary">
        {type === "folder" ? (
          <Folder size={20} className="text-secondary" />
        ) : (
          <FileText size={20} className="text-[#1967d2]" />
        )}
        <MoreVertical size={20} />
      </div>

      <div className="flex-1 flex items-center justify-center bg-white rounded-lg mb-3 overflow-hidden">
        {getIcon()}
      </div>

      <div className="text-sm font-medium text-primary truncate">{name}</div>
    </div>
  );
};

export default FileCard;
