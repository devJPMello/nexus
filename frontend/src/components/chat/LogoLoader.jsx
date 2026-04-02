import { BRANDING } from '../../constants/brandingUrls';
import './LogoLoader.css';

const LogoLoader = () => {
  return (
    <div className="logo-loader">
      <div className="logo-container">
        <img src={BRANDING.logoWhite} alt="Logo" className="pulsing-logo" />
      </div>
    </div>
  );
};

export default LogoLoader;