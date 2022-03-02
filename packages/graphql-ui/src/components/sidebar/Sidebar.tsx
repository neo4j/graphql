const SideBar = () => {
    return (
        <div className="flex flex-col w-24 h-screen p-4 overflow-y-auto bg-sidebargrey">
            <div className="flex flex-col justify-between align-center text-white">
                <ul>
                    <li className="p-4 flex justify-center">
                        <span className="font-medium text-2xl cursor-pointer">S</span>
                    </li>
                    <li className="p-4 flex justify-center">
                        <span className="font-medium text-2xl cursor-pointer">Q</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default SideBar;
