document.addEventListener('DOMContentLoaded', () => {
  const log = document.getElementById('dev-log');

  const show = (payload) => {
    log.textContent = JSON.stringify(payload, null, 2);
  };

  document.getElementById('btn-validate-create').addEventListener('click', async () => {
    log.textContent = 'Validating create payload...';
    const res = await apiValidateItem({
      name: 'Laser Cutter',
      quantity: 2,
      price: 499.99,
      category: 'Tools'
    });
    show(res);
  });

  document.getElementById('btn-validate-update').addEventListener('click', async () => {
    log.textContent = 'Validating update payload...';
    const res = await apiValidateItem({
      id: 999999,       // Deliberately missing record to show error handling
      price: 12.50
    });
    show(res);
  });

  // Placeholder Phaser scene hook if you want to evolve this into a full game.
  // The container remains so you can mount a Phaser.Game when ready:
  // const game = new Phaser.Game({ type: Phaser.AUTO, width: 800, height: 600, parent: 'game-container', scene: { preload, create, update } });
});
