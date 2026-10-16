// Footer on ink: logo, shout, three link columns, legal line.
export function footer() {
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
  <div class="site-footer__in">
    <div class="site-footer__top">
      <div class="site-footer__brand">
        <img src="/logos/waxtapelogo_Positivo-bg.svg" alt="waxtape." width="220" height="55">
        <p class="site-footer__shout">go skate.</p>
      </div>
      <div><h2>shop</h2><ul>
        <li><a href="/apparel/">apparel</a></li>
        <li><a href="/accessories/">accesories</a></li>
        <li><a href="/board/">board</a></li>
        <li><a href="/all/">all mods</a></li>
      </ul></div>
      <div><h2>help</h2><ul>
        <li><a href="/guide/">install guide</a></li>
        <li><a href="/about/">about</a></li>
        <li><a href="/ezine/">ezine</a></li>
      </ul></div>
      <div><h2>elsewhere</h2><ul>
        <li><a href="https://thunderstore.io/" rel="noopener">Thunderstore</a></li>
      </ul></div>
    </div>
    <div class="site-footer__legal">
      <span>All mods are free. Unzip, drop in your Reskate mods folder, skate.</span>
      <span>Waxtape is a fan project, not affiliated with the game's developers or publishers.</span>
      <span>© ${year} waxtape.</span>
    </div>
  </div>
</footer>`;
}
