function ItemCard({ item, onBuy, onEquip }) {
  return (
    <div className="item-card">
      <h3>{item.itemName}</h3>
      <p>등급: {item.rarity}</p>
      <p>가격: {item.price}P</p>

      {onBuy && <button onClick={() => onBuy(item)}>구매</button>}
      {onEquip && <button onClick={() => onEquip(item.uiId)}>장착 / 해제</button>}
    </div>
  );
}

export default ItemCard;
