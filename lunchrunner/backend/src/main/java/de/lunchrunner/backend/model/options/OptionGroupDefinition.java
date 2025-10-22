package de.lunchrunner.backend.model.options;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class OptionGroupDefinition {

    public enum GroupType {
        single,
        multi
    }

    private final String id;
    private final String label;
    private final GroupType type;
    private final List<OptionValueDefinition> values;

    @JsonCreator
    public OptionGroupDefinition(@JsonProperty(value = "id", required = true) String id,
                                 @JsonProperty(value = "label", required = true) String label,
                                 @JsonProperty(value = "type", required = true) GroupType type,
                                 @JsonProperty(value = "values", required = true) List<OptionValueDefinition> values) {
        this.id = id;
        this.label = label;
        this.type = type;
        this.values = values;
    }

    public String getId() {
        return id;
    }

    public String getLabel() {
        return label;
    }

    public GroupType getType() {
        return type;
    }

    public List<OptionValueDefinition> getValues() {
        return values;
    }
}
