import React from 'react';
import FileCard from '../components/FileCard';
const Dashboard = () => {
    const folders = [
        { id: 1, name: 'Project Alpha', type: 'folder' },
        { id: 2, name: 'Marketing Assets', type: 'folder' },
        { id: 3, name: 'Financials 2024', type: 'folder' },
        { id: 4, name: 'Personal', type: 'folder' },
    ];

    const files = [
        { id: 5, name: 'Q4 Report.pdf', type: 'pdf' },
        { id: 6, name: 'Meeting Notes.docx', type: 'doc' },
        { id: 7, name: 'Banner Design.png', type: 'image' },
        { id: 8, name: 'Budget.xlsx', type: 'sheet' },
        { id: 9, name: 'Team Photo.jpg', type: 'image' },
        { id: 10, name: 'Presentation.pptx', type: 'slide' },
    ];

    return (
        <div className="p-4">
            <h2 className="text-secondary font-medium mb-4">Suggested</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {files.slice(0, 3).map(file => (
                    <FileCard key={file.id} {...file} />
                ))}
            </div>

            <h2 className="text-secondary font-medium mb-4">Folders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {folders.map(folder => (
                    <FileCard key={folder.id} {...folder} />
                ))}
            </div>

            <h2 className="text-secondary font-medium mb-4">Files</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map(file => (
                    <FileCard key={file.id} {...file} />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
