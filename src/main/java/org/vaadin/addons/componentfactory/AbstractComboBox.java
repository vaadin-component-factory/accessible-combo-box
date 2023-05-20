package org.vaadin.addons.componentfactory;

import com.vaadin.flow.component.AbstractSinglePropertyField;
import com.vaadin.flow.component.AttachEvent;
import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.ComponentEvent;
import com.vaadin.flow.component.ComponentEventListener;
import com.vaadin.flow.component.DetachEvent;
import com.vaadin.flow.component.DomEvent;
import com.vaadin.flow.component.EventData;
import com.vaadin.flow.component.Focusable;
import com.vaadin.flow.component.HasHelper;
import com.vaadin.flow.component.HasLabel;
import com.vaadin.flow.component.HasSize;
import com.vaadin.flow.component.HasStyle;
import com.vaadin.flow.component.HasTheme;
import com.vaadin.flow.component.HasValidation;
import com.vaadin.flow.component.ItemLabelGenerator;
import com.vaadin.flow.component.Synchronize;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.data.binder.HasFilterableDataProvider;
import com.vaadin.flow.data.binder.HasValidator;
import com.vaadin.flow.data.provider.CallbackDataProvider;
import com.vaadin.flow.data.provider.CompositeDataGenerator;
import com.vaadin.flow.data.provider.DataKeyMapper;
import com.vaadin.flow.data.provider.DataProvider;
import com.vaadin.flow.data.provider.ListDataProvider;
import com.vaadin.flow.data.renderer.Renderer;
import com.vaadin.flow.dom.ElementConstants;
import com.vaadin.flow.function.SerializableBiFunction;
import com.vaadin.flow.function.SerializableConsumer;
import com.vaadin.flow.function.SerializableFunction;
import com.vaadin.flow.function.SerializableSupplier;
import com.vaadin.flow.shared.Registration;

import java.util.Collection;
import java.util.Locale;
import java.util.Objects;

/**
 * Provides base functionality for combo box related components, such as
 * {@link ComboBox}
 *
 * @param <TComponent>
 *            Type of the component that extends from this class
 * @param <TItem>
 *            Type of individual items that are selectable in the combo box
 * @param <TValue>
 *            Type of the selection / value of the extending component
 */
public abstract class AbstractComboBox<TComponent extends AbstractComboBox<TComponent, TItem, TValue>, TItem, TValue>
        extends AbstractSinglePropertyField<TComponent, TValue>
        implements HasStyle, Focusable<TComponent>, HasSize, HasValidation,
        HasHelper, HasTheme, HasLabel, HasFilterableDataProvider<TItem, String>,
        HasValidator<TValue> {

    /**
     * Registration for custom value listeners that disallows entering custom
     * values as soon as there are no more listeners for the custom value event
     */
    private class CustomValueRegistration implements Registration {

        private Registration delegate;

        private CustomValueRegistration(Registration delegate) {
            this.delegate = delegate;
        }

        @Override
        public void remove() {
            if (delegate != null) {
                delegate.remove();
                customValueListenersCount--;

                if (customValueListenersCount == 0) {
                    setAllowCustomValue(false);
                }
                delegate = null;
            }
        }
    }

    private ItemLabelGenerator<TItem> itemLabelGenerator = String::valueOf;
    private final ComboBoxRenderManager<TItem> renderManager;
    private final ComboBoxDataController<TItem> dataController;
    private int customValueListenersCount;

    /**
     * Constructs a new ComboBoxBase instance
     *
     * @param valuePropertyName
     *            name of the value property of the web component that should be
     *            used to set values, or listen to value changes
     * @param defaultValue
     *            the default value of the component
     * @param valuePropertyType
     *            the class that represents the type of the raw value of the
     *            Flow element property
     * @param presentationToModel
     *            a function to convert a raw property value into a value using
     *            the user-specified model type
     * @param modelToPresentation
     *            a function to convert a value using the user-specified model
     *            type into a raw property value
     * @param <TValueProperty>
     *            the type of the raw value of the Flow element property
     */
    public <TValueProperty> AbstractComboBox(String valuePropertyName,
            TValue defaultValue, Class<TValueProperty> valuePropertyType,
            SerializableBiFunction<TComponent, TValueProperty, TValue> presentationToModel,
            SerializableBiFunction<TComponent, TValue, TValueProperty> modelToPresentation) {
        super(valuePropertyName, defaultValue, valuePropertyType,
                presentationToModel, modelToPresentation);

        // Extracted as implementation to fix serialization issue:
        // https://github.com/vaadin/flow-components/issues/4420
        // Do not replace with method reference
        SerializableSupplier<Locale> localeSupplier = new SerializableSupplier<Locale>() {
            @Override
            public Locale get() {
                return AbstractComboBox.this.getLocale();
            }
        };

        renderManager = new ComboBoxRenderManager<>(this);
        dataController = new ComboBoxDataController<>(this, localeSupplier);
        dataController.getDataGenerator().addDataGenerator((item,
                jsonObject) -> jsonObject.put("label", generateLabel(item)));

        // Configure web component to use key property from the generated
        // wrapper items for identification
        getElement().setProperty("itemValuePath", "key");
        getElement().setProperty("itemIdPath", "key");

        // Disable template warnings
        getElement().setAttribute("suppress-template-warning", true);

        // Notify data communicator when selection changes, which allows to
        // free up items / keys in the KeyMapper that are not used anymore in
        // the selection
        addValueChangeListener(
                e -> getDataCommunicator().notifySelectionChanged());

        // addValueChangeListener(e -> validate());
    }

    /**
     * Whether the component should automatically receive focus when the page
     * loads.
     *
     * @return {@code true} if the component should automatically receive focus
     */
    public boolean isAutofocus() {
        return getElement().getProperty("autofocus", false);
    }

    /**
     * Sets the whether the component should automatically receive focus when
     * the page loads. Defaults to {@code false}.
     *
     * @param autofocus
     *            {@code true} component should automatically receive focus
     */
    public void setAutofocus(boolean autofocus) {
        getElement().setProperty("autofocus", autofocus);
    }

    /**
     * Gets the page size, which is the number of items fetched at a time from
     * the data provider.
     * <p>
     * The page size is also the largest number of items that can support
     * client-side filtering. If you provide more items than the page size, the
     * component has to fall back to server-side filtering.
     * <p>
     * The default page size is 50.
     *
     * @return the maximum number of items sent per request
     * @see #setPageSize(int)
     */
    public int getPageSize() {
        return getElement().getProperty("pageSize", 50);
    }

    /**
     * Sets the page size, which is the number of items requested at a time from
     * the data provider. This does not guarantee a maximum query size to the
     * backend; when the overlay has room to render more new items than the page
     * size, multiple "pages" will be requested at once.
     * <p>
     * The page size is also the largest number of items that can support
     * client-side filtering. If you provide more items than the page size, the
     * component has to fall back to server-side filtering.
     * <p>
     * Setting the page size after the ComboBox has been rendered effectively
     * resets the component, and the current page(s) and sent over again.
     * <p>
     * The default page size is 50.
     *
     * @param pageSize
     *            the maximum number of items sent per request, should be
     *            greater than zero
     */
    public void setPageSize(int pageSize) {
        if (pageSize < 1) {
            throw new IllegalArgumentException(
                    "Page size should be greater than zero.");
        }
        getElement().setProperty("pageSize", pageSize);
        dataController.setPageSize(pageSize);
    }

    /**
     * Whether the dropdown is opened or not.
     *
     * @return {@code true} if the drop-down is opened, {@code false} otherwise
     */
    @Synchronize(property = "opened", value = "opened-changed")
    public boolean isOpened() {
        return getElement().getProperty("opened", false);
    }

    /**
     * Sets whether the dropdown should be opened or not.
     *
     * @param opened
     *            {@code true} to open the drop-down, {@code false} to close it
     */
    public void setOpened(boolean opened) {
        getElement().setProperty("opened", opened);
    }

    /**
     * If {@code true}, the user can input string values that do not match to
     * any existing item labels, which will fire a {@link CustomValueSetEvent}.
     *
     * @return {@code true} if the component fires custom value set events,
     *         {@code false} otherwise
     * @see #setAllowCustomValue(boolean)
     * @see #addCustomValueSetListener(ComponentEventListener)
     */
    public boolean isAllowCustomValue() {
        return getElement().getProperty("allowCustomValue", false);
    }

    /**
     * Enables or disables the component firing events for custom string input.
     * <p>
     * When enabled, a {@link CustomValueSetEvent} will be fired when the user
     * inputs a string value that does not match any existing items and commits
     * it eg. by blurring or pressing the enter-key.
     * <p>
     * Note that ComboBox doesn't do anything with the custom value string
     * automatically. Use the
     * {@link #addCustomValueSetListener(ComponentEventListener)} method to
     * determine how the custom value should be handled. For example, when the
     * ComboBox has {@code String} as the value type, you can add a listener
     * which sets the custom string as the value of the ComboBox with
     * {@link #setValue(Object)}.
     * <p>
     * Setting to {@code true} also allows an unfocused ComboBox to display a
     * string that doesn't match any of its items nor its current value, unless
     * this is explicitly handled with
     * {@link #addCustomValueSetListener(ComponentEventListener)}. When set to
     * {@code false}, an unfocused ComboBox will always display the label of the
     * currently selected item.
     *
     * @param allowCustomValue
     *            {@code true} to enable custom value set events, {@code false}
     *            to disable them
     * @see #addCustomValueSetListener(ComponentEventListener)
     */
    public void setAllowCustomValue(boolean allowCustomValue) {
        getElement().setProperty("allowCustomValue", allowCustomValue);
    }

    /**
     * Filtering string the user has typed into the input field.
     *
     * @return the filter string
     */
    @Synchronize(property = "filter", value = "filter-changed")
    protected String getFilter() {
        return getElement().getProperty("filter");
    }

    /**
     * Sets the filter string for the filter input.
     * <p>
     * Setter is only required to allow using @Synchronize
     *
     * @param filter
     *            the String value to set
     */
    protected void setFilter(String filter) {
        getElement().setProperty("filter", filter == null ? "" : filter);
    }

    /**
     * Whether the component has an invalid value or not.
     */
    public boolean isInvalid() {
        return getElement().getProperty("invalid", false);
    }

    /**
     * Sets whether the component has an invalid value or not.
     */
    public void setInvalid(boolean invalid) {
        getElement().setProperty("invalid", invalid);
    }

    /**
     * Sets whether the component requires a value to be considered in a valid
     * state.
     *
     * @return {@code true} if the component requires a value to be valid
     */
    public boolean isRequired() {
        return super.isRequiredIndicatorVisible();
    }

    /**
     * Whether the component requires a value to be considered in a valid state.
     *
     * @param required
     *            {@code true} if the component requires a value to be valid
     */
    public void setRequired(boolean required) {
        super.setRequiredIndicatorVisible(required);
    }

    /**
     * The error message that should be displayed when the component becomes
     * invalid
     */
    public String getErrorMessage() {
        return getElement().getProperty("errorMessage");
    }

    /**
     * Sets the error message that should be displayed when the component
     * becomes invalid
     */
    public void setErrorMessage(String errorMessage) {
        getElement().setProperty("errorMessage",
                errorMessage == null ? "" : errorMessage);
    }

    /**
     * The placeholder text that should be displayed in the input element, when
     * the user has not entered a value
     *
     * @return the placeholder text
     */
    public String getPlaceholder() {
        return getElement().getProperty("placeholder");
    }

    /**
     * Sets the placeholder text that should be displayed in the input element,
     * when the user has not entered a value
     *
     * @param placeholder
     *            the placeholder text
     */
    public void setPlaceholder(String placeholder) {
        getElement().setProperty("placeholder",
                placeholder == null ? "" : placeholder);
    }

    /**
     * Gets whether dropdown will open automatically or not.
     *
     * @return {@code true} if enabled, {@code false} otherwise
     */
    public boolean isAutoOpen() {
        return !getElement().getProperty("autoOpenDisabled", false);
    }

    /**
     * Enables or disables the dropdown opening automatically. If {@code false}
     * the dropdown is only opened when clicking the toggle button or pressing
     * Up or Down arrow keys.
     *
     * @param autoOpen
     *            {@code false} to prevent the dropdown from opening
     *            automatically
     */
    public void setAutoOpen(boolean autoOpen) {
        getElement().setProperty("autoOpenDisabled", !autoOpen);
    }

    @Override
    public void setRequiredIndicatorVisible(boolean requiredIndicatorVisible) {
        super.setRequiredIndicatorVisible(requiredIndicatorVisible);
    }

    /**
     * Sets the item label generator that is used to produce the strings shown
     * in the combo box for each item. By default,
     * {@link String#valueOf(Object)} is used.
     * <p>
     * When the {@link #setRenderer(Renderer)} is used, the ItemLabelGenerator
     * is only used to show the selected item label.
     *
     * @param itemLabelGenerator
     *            the item label provider to use, not null
     */
    public void setItemLabelGenerator(
            ItemLabelGenerator<TItem> itemLabelGenerator) {
        Objects.requireNonNull(itemLabelGenerator,
                "The item label generator can not be null");
        this.itemLabelGenerator = itemLabelGenerator;
        dataController.reset();
        if (getValue() != null) {
            refreshValue();
        }
    }

    /**
     * Gets the item label generator that is used to produce the strings shown
     * in the combo box for each item.
     *
     * @return the item label generator used, not null
     */
    public ItemLabelGenerator<TItem> getItemLabelGenerator() {
        return itemLabelGenerator;
    }

    /**
     * Generates a string label for a data item using the current item label
     * generator
     *
     * @param item
     *            the data item
     * @return string label for the data item
     */
    protected String generateLabel(TItem item) {
        if (item == null) {
            return "";
        }
        String label = getItemLabelGenerator().apply(item);
        if (label == null) {
            throw new IllegalStateException(String.format(
                    "Got 'null' as a label value for the item '%s'. "
                            + "'%s' instance may not return 'null' values",
                    item, ItemLabelGenerator.class.getSimpleName()));
        }
        return label;
    }

    /**
     * Sets the Renderer responsible to render the individual items in the list
     * of possible choices of the ComboBox. It doesn't affect how the selected
     * item is rendered - that can be configured by using
     * {@link #setItemLabelGenerator(ItemLabelGenerator)}.
     *
     * @param renderer
     *            a renderer for the items in the selection list of the
     *            ComboBox, not <code>null</code>
     *            <p>
     *            Note that filtering of the ComboBox is not affected by the
     *            renderer that is set here. Filtering is done on the original
     *            values and can be affected by
     *            {@link #setItemLabelGenerator(ItemLabelGenerator)}.
     */
    public void setRenderer(Renderer<TItem> renderer) {
        Objects.requireNonNull(renderer, "The renderer must not be null");

        renderManager.setRenderer(renderer);
    }

    @Override
    public void setValue(TValue value) {
        if (getDataCommunicator() == null) {
            if (value == getEmptyValue()) {
                return;
            } else {
                throw new IllegalStateException(
                        "Cannot set a value for a ComboBox without items. "
                                + "Use setItems to populate items into the "
                                + "ComboBox before setting a value.");
            }
        }
        super.setValue(value);
        refreshValue();
    }

    @Override
    protected void onAttach(AttachEvent attachEvent) {
        super.onAttach(attachEvent);
        initConnector();
        dataController.onAttach();

        FieldValidationUtil.disableClientValidation(this);
    }

    @Override
    protected void onDetach(DetachEvent detachEvent) {
        dataController.onDetach();
        super.onDetach(detachEvent);
    }

    /**
     * Adds a listener for the event which is fired when user inputs a string
     * value that does not match any existing items and commits it eg. by
     * blurring or pressing the enter-key.
     * <p>
     * Note that ComboBox doesn't do anything with the custom value string
     * automatically. Use this method to determine how the custom value should
     * be handled. For example, when the ComboBox has {@code String} as the
     * value type, you can add a listener which sets the custom string as the
     * value of the ComboBox with {@link #setValue(Object)}.
     * <p>
     * As a side effect, this makes the ComboBox allow custom values. If you
     * want to disable the firing of custom value set events once the listener
     * is added, please disable it explicitly via the
     * {@link #setAllowCustomValue(boolean)} method.
     * <p>
     * The custom value becomes disallowed automatically once the last custom
     * value set listener is removed.
     *
     * @param listener
     *            the listener to be notified when a new value is filled
     * @return a {@link Registration} for removing the event listener
     * @see #setAllowCustomValue(boolean)
     */
    public Registration addCustomValueSetListener(
            ComponentEventListener<CustomValueSetEvent<TComponent>> listener) {
        setAllowCustomValue(true);
        customValueListenersCount++;
        Registration registration = addInternalCustomValueSetListener(listener);
        return new CustomValueRegistration(registration);
    }

    /**
     * Adds a custom value event listener to the component. Can be used
     * internally to register a listener without also enabling allowing custom
     * values, which is a side-effect of
     * {@link #addCustomValueSetListener(ComponentEventListener)}
     */
    @SuppressWarnings({ "rawtypes", "unchecked" })
    private Registration addInternalCustomValueSetListener(
            ComponentEventListener<CustomValueSetEvent<TComponent>> listener) {
        return addListener(CustomValueSetEvent.class,
                (ComponentEventListener) listener);
    }

    // ****************************************************
    // Data provider implementation
    // ****************************************************

    /**
     * Gets the data provider used by this ComboBox.
     *
     * @return the data provider used by this ComboBox
     */
    public DataProvider<TItem, ?> getDataProvider() {
        return dataController.getDataProvider();
    }

    /**
     * {@inheritDoc}
     * <p>
     * The filter-type of the given data provider must be String so that it can
     * handle the filters typed into the ComboBox by users. If your data
     * provider uses some other type of filter, you can provide a function which
     * converts the ComboBox's filter-string into that type via
     * {@link #setDataProvider(DataProvider, SerializableFunction)}. Another way
     * to do the same thing is to use this method with your data provider
     * converted with
     * {@link DataProvider#withConvertedFilter(SerializableFunction)}.
     * <p>
     * Changing the combo box's data provider resets its current value to
     * {@code null}.
     */
    @Override
    public void setDataProvider(DataProvider<TItem, String> dataProvider) {
        dataController.setDataProvider(dataProvider);
    }

    /**
     * {@inheritDoc}
     * <p>
     * ComboBox triggers filtering queries based on the strings users type into
     * the field. For this reason you need to provide the second parameter, a
     * function which converts the filter-string typed by the user into
     * filter-type used by your data provider. If your data provider already
     * supports String as the filter-type, it can be used without a converter
     * function via {@link #setDataProvider(DataProvider)}.
     * <p>
     * Using this method provides the same result as using a data provider
     * wrapped with
     * {@link DataProvider#withConvertedFilter(SerializableFunction)}.
     * <p>
     * Changing the combo box's data provider resets its current value to
     * {@code null}.
     *
     */
    @Override
    public <C> void setDataProvider(DataProvider<TItem, C> dataProvider,
            SerializableFunction<String, C> filterConverter) {
        dataController.setDataProvider(dataProvider, filterConverter);
    }

    /**
     * Sets a list data provider as the data provider of this combo box.
     * <p>
     * Filtering will use a case insensitive match to show all items where the
     * filter text is a substring of the label displayed for that item, which
     * you can configure with
     * {@link #setItemLabelGenerator(ItemLabelGenerator)}.
     * <p>
     * Filtering will be handled in the client-side if the size of the data set
     * is less than the page size. To force client-side filtering with a larger
     * data set (at the cost of increased network traffic), you can increase the
     * page size with {@link #setPageSize(int)}.
     * <p>
     * Changing the combo box's data provider resets its current value to
     * {@code null}.
     *
     * @param listDataProvider
     *            the list data provider to use, not <code>null</code>
     */
    public void setDataProvider(ListDataProvider<TItem> listDataProvider) {
        dataController.setDataProvider(listDataProvider);
    }

    /**
     * Sets a CallbackDataProvider using the given fetch items callback and a
     * size callback.
     * <p>
     * This method is a shorthand for making a {@link CallbackDataProvider} that
     * handles a partial {@link com.vaadin.flow.data.provider.Query Query}
     * object.
     * <p>
     * Changing the combo box's data provider resets its current value to
     * {@code null}.
     *
     * @param fetchItems
     *            a callback for fetching items, not <code>null</code>
     * @param sizeCallback
     *            a callback for getting the count of items, not
     *            <code>null</code>
     * @see CallbackDataProvider
     * @see #setDataProvider(DataProvider)
     */
    public void setDataProvider(ComboBox.FetchItemsCallback<TItem> fetchItems,
            SerializableFunction<String, Integer> sizeCallback) {
        dataController.setDataProvider(fetchItems, sizeCallback);
    }

    /**
     * Sets a list data provider with an item filter as the data provider of
     * this combo box. The item filter is used to compare each item to the
     * filter text entered by the user.
     * <p>
     * Note that defining a custom filter will force the component to make
     * server roundtrips to handle the filtering. Otherwise it can handle
     * filtering in the client-side, if the size of the data set is less than
     * the {@link #setPageSize(int) pageSize}.
     * <p>
     * Changing the combo box's data provider resets its current value to
     * {@code null}.
     *
     * @param itemFilter
     *            filter to check if an item is shown when user typed some text
     *            into the ComboBox
     * @param listDataProvider
     *            the list data provider to use, not <code>null</code>
     */
    public void setDataProvider(ComboBox.ItemFilter<TItem> itemFilter,
            ListDataProvider<TItem> listDataProvider) {
        dataController.setDataProvider(itemFilter, listDataProvider);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Filtering will use a case insensitive match to show all items where the
     * filter text is a substring of the label displayed for that item, which
     * you can configure with
     * {@link #setItemLabelGenerator(ItemLabelGenerator)}.
     * <p>
     * Filtering will be handled in the client-side if the size of the data set
     * is less than the page size. To force client-side filtering with a larger
     * data set (at the cost of increased network traffic), you can increase the
     * page size with {@link #setPageSize(int)}.
     * <p>
     * Setting the items creates a new DataProvider, which in turn resets the
     * combo box's value to {@code null}. If you want to add and remove items to
     * the current item set without resetting the value, you should update the
     * previously set item collection and call
     * {@code getDataProvider().refreshAll()}.
     */
    @Override
    public void setItems(Collection<TItem> items) {
        setDataProvider(DataProvider.ofCollection(items));
    }

    /**
     * Whether the item is currently selected in the combo box.
     *
     * @param item
     *            the item to check
     * @return {@code true} if the item is selected, {@code false} otherwise
     */
    protected abstract boolean isSelected(TItem item);

    /**
     * Refresh value / selection of the web component after changes that might
     * affect the presentation / rendering of items
     */
    protected abstract void refreshValue();

    /**
     * Accesses the render manager that is managing the custom renderer
     *
     * @return the render manager
     */
    protected ComboBoxRenderManager<TItem> getRenderManager() {
        return renderManager;
    }

    /**
     * Accesses the data controller that is managing data communication with the
     * web component
     * <p>
     * Can be null if the constructor has not run yet
     *
     * @return the data controller
     */
    protected ComboBoxDataController<TItem> getDataController() {
        return dataController;
    }

    /**
     * Accesses the data communicator that is managed by the data controller
     * <p>
     * Can be null if the no data source has been set yet, or if the constructor
     * has not run yet
     *
     * @return the data communicator
     */
    protected ComboBoxDataCommunicator<TItem> getDataCommunicator() {
        return dataController != null ? dataController.getDataCommunicator()
                : null;
    }

    /**
     * Accesses the data generator that is managed by the data controller
     * <p>
     * Can be null if the constructor has not run yet
     *
     * @return the data generator
     */
    protected CompositeDataGenerator<TItem> getDataGenerator() {
        return dataController != null ? dataController.getDataGenerator()
                : null;
    }

    /**
     * Accesses the key mapper that is managed by the data controller
     * <p>
     * Can be null if the no data source has been set yet, or if the constructor
     * has not run yet
     *
     * @return the key mapper
     */
    protected DataKeyMapper<TItem> getKeyMapper() {
        return getDataCommunicator() != null
                ? getDataCommunicator().getKeyMapper()
                : null;
    }

    /**
     * Called by the client-side connector, delegates to data controller
     *
     * @param id
     *            the update identifier
     */
    @ClientCallable
    private void confirmUpdate(int id) {
        dataController.confirmUpdate(id);
    }

    /**
     * Called by the client-side connector, delegates to data controller
     */
    @ClientCallable
    private void setRequestedRange(int start, int length, String filter) {
        dataController.setRequestedRange(start, length, filter);
    }

    /**
     * Called by the client-side connector, delegates to data controller
     */
    @ClientCallable
    private void resetDataCommunicator() {
        dataController.resetDataCommunicator();
    }

    /**
     * Helper for running a command in the before client response hook
     *
     * @param command
     *            the command to execute
     */
    protected void runBeforeClientResponse(SerializableConsumer<UI> command) {
        getElement().getNode().runWhenAttached(ui -> ui
                .beforeClientResponse(this, context -> command.accept(ui)));
    }

    private void initConnector() {
        getElement().executeJs(
                "window.Vaadin.Flow.comboBoxConnector.initLazy(this)");
    }

    /**
     * Gets the visibility of the button which clears the field, which is
     * {@code false} by default.
     *
     * @return <code>true</code> if the button is visible, <code>false</code>
     *         otherwise
     */
    public boolean isClearButtonVisible() {
        return getElement().getProperty("clearButtonVisible", false);
    }

    /**
     * Sets the visibility of the button which clears the field.
     *
     * @param clearButtonVisible
     *            <code>true</code> to show the clear button, <code>false</code>
     *            to hide it
     */
    public void setClearButtonVisible(boolean clearButtonVisible) {
        getElement().setProperty("clearButtonVisible", clearButtonVisible);
    }

    /**
     * A regular expression that the user input is checked against. The allowed
     * pattern must matches a single character, not the sequence of characters.
     *
     * @return the {@code allowedCharPattern} property
     */
    public String getAllowedCharPattern() {
        return getElement().getProperty("allowedCharPattern", "");
    }

    /**
     * Sets a regular expression for the user input to pass on the client-side.
     * The allowed char pattern must be a valid JavaScript Regular Expression
     * that matches a single character, not the sequence of characters.
     * <p>
     * For example, to allow entering only numbers and slash character, use
     * {@code setAllowedCharPattern("[0-9/]")}`.
     * </p>
     *
     * @param pattern
     *            the String pattern to set
     */
    public void setAllowedCharPattern(String pattern) {
        getElement().setProperty("allowedCharPattern",
                pattern == null ? "" : pattern);
    }

    /**
     * Set the label of the component to the given text.
     *
     * @param label
     *            the label text to set or {@code null} to clear
     */
    public void setLabel(String label) {
        getElement().setProperty(ElementConstants.LABEL_PROPERTY_NAME, label);
    }

    /**
     * Gets the label of the component.
     *
     * @return the label of the component or {@code null} if no label has been
     *         set
     */
    public String getLabel() {
        return getElement().getProperty(ElementConstants.LABEL_PROPERTY_NAME,
                null);
    }

    /**
     * Event that is dispatched from a combo box component, if the component
     * allows setting custom values, and the user has entered a non-empty value
     * that does not match any of the existing items
     *
     * @param <TComponent>
     *            The specific combo box component type
     */
    @DomEvent("custom-value-set")
    public static class CustomValueSetEvent<TComponent extends AbstractComboBox<TComponent, ?, ?>>
            extends ComponentEvent<TComponent> {
        private final String detail;

        public CustomValueSetEvent(TComponent source, boolean fromClient,
                @EventData("event.detail") String detail) {
            super(source, fromClient);
            this.detail = detail;
        }

        public String getDetail() {
            return detail;
        }
    }
}