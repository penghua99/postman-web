import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-pm-bg-darkest text-pm-fg-primary">
      <Outlet />
    </div>
  );
};

export default Layout;
