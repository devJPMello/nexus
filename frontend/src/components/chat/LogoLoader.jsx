import logoBranca from '../../assets/images/Logo-branca.png';
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