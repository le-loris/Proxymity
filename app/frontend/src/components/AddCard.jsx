function AddCard({ onClick }) {
  return (
    <div
      className="add-card"
      onClick={onClick}
      style={{ transition: 'background-color 0.2s' }}
    >
      +
    </div>
  );
}

export default AddCard;
