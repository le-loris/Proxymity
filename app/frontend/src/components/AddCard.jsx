function AddCard({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        minWidth: '250px',
        maxWidth: '300px',
        flex: '1 1 300px',
        border: '2px dashed #aaa',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#666',
        fontSize: '2rem',
        backgroundColor: '#fafafa',
        transition: 'background-color 0.2s',
      }}
    >
      +
    </div>
  );
}

export default AddCard;
