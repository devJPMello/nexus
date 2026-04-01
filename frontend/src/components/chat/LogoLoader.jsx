import logoBranca from '../../assets/images/logo-branca.svg';
import './LogoLoader.css';

const LogoLoader = () => {
  return (
    <div className="logo-loader">
      <div className="logo-container">
        <img src={logoBranca} alt="Logo" className="pulsing-logo" />
      </div>
    </div>
  );
};

export default LogoLoader;