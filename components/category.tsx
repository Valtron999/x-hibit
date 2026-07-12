import { Category } from "@/data/category";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  data: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
  showAll?: boolean;
};

export default function CategoryTabs({
  data,
  activeCategory,
  onSelect,
  showAll = true,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {showAll ? (
        <TouchableOpacity
          onPress={() => onSelect("all")}
          style={[
            styles.button,
            {
              backgroundColor: activeCategory === "all" ? "#ED3237" : "#848688",
            },
          ]}
        >
          <Text style={styles.text}>All</Text>
        </TouchableOpacity>
      ) : null}

      {data.map((item) => {
        const isActive = item.id === activeCategory;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={[
              styles.button,
              { backgroundColor: isActive ? "#ED3237" : "#848688" },
            ]}
          >
            <Text style={styles.text}>{item.title}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 0,
    marginBottom: 20,
  },
  contentContainer: {
    paddingRight: 20,
  },
  button: {
    minWidth: 120,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
