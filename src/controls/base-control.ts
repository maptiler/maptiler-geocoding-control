export interface GeocodingControlBase<Options extends object> {
  /**
   * Update the control options.
   *
   * @param options options to update
   */
  setOptions(options: Options): void;

  /**
   * Set the content of search input box.
   *
   * @param value text to set
   */
  setQuery(value: string): void;

  /**
   * Set the content of search input box and immediately submit it.
   *
   * @param value text to set and submit
   */
  submitQuery(value: string): void;

  /**
   * Clear geocoding search results from the map.
   */
  clearMap(): void;

  /**
   * Clear search result list.
   */
  clearList(): void;

  /**
   * Set reverse geocoding mode.
   *
   * @param reverseActive reverse geocoding active
   */
  setReverseMode(reverseActive: boolean): void;

  /**
   * Focus the search input box.
   *
   * @param options [FocusOptions](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#options)
   */
  focus(options?: FocusOptions): void;

  /**
   * Blur the search input box.
   */
  blur(): void;
}
