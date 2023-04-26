package org.vaadin.addons.componentfactory;

import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;

@Route("")
public class View extends VerticalLayout {

    public View() {
        setSizeFull();

        ComboBox<String> combo = new ComboBox<>("Label");
        combo.setPlaceholder("placeholder");
        combo.setItems("Zero", "One", "Two", "Three", "Four", "Five", "Six",
                "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
                "-One", "-Two", "-Three", "-Four", "-Five", "-Six", "-Seven",
                "-Eight", "-Nine", "-Ten", "-Eleven", "-Twelve", "-Thirteen");
        combo.addValueChangeListener(e -> {
            Notification.show("Value: " + e.getValue());
        });

        Checkbox error = new Checkbox("error");
        error.addValueChangeListener(e -> {
            combo.setInvalid(error.getValue());
            combo.setErrorMessage("Error message");
        });

        Checkbox required = new Checkbox("required");
        required.addValueChangeListener(e -> {
            combo.setRequiredIndicatorVisible(required.getValue());
        });

        Checkbox helper = new Checkbox("helper");
        helper.addValueChangeListener(e -> {
            if (helper.getValue()) {
                combo.setHelperText("Helper text");
            } else {
                combo.setHelperText(null);
            }
        });

        Checkbox disabled = new Checkbox("disabled");
        disabled.addValueChangeListener(e -> {
            combo.setDisabled(disabled.getValue());
        });

        Checkbox readOnly = new Checkbox("readOnly");
        readOnly.addValueChangeListener(e -> {
            combo.setReadOnly(readOnly.getValue());
        });

        Checkbox clear = new Checkbox("clear");
        clear.addValueChangeListener(e -> {
            combo.setClearButtonVisible(clear.getValue());
        });

        add(combo, error, disabled, readOnly, helper, required, clear);
    }
}
