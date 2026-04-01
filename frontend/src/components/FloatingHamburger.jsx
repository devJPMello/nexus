import './FloatingHamburger.css';

const FloatingHamburger = ({ isOpen, onToggle }) => {
  return (
    <button 
      className={`floating-hamburger ${isOpen ? 'open' : ''}`}
      onClick={onToggle}
      aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
    >
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
    </button>
  );
};

export default FloatingHamburger;
