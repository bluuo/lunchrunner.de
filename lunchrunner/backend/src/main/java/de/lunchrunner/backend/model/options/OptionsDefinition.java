package de.lunchrunner.backend.model.options;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Collections;
import java.util.List;

public class OptionsDefinition {

    private final List<OptionGroupDefinition> groups;

    @JsonCreator
    public OptionsDefinition(@JsonProperty(value = "groups", required = true) List<OptionGroupDefinition> groups) {
        this.groups = groups == null ? Collections.emptyList() : List.copyOf(groups);
    }

    public List<OptionGroupDefinition> getGroups() {
        return groups;
    }
}
