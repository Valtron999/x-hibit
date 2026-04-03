import { Category } from "@/data/category";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  data: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
};

export default function CategoryTabs({
  data,
  activeCategory,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      
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

      {/* REAL CATEGORIES */}
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
    paddingLeft: 20,
    marginBottom: 20,
  },
  button: {
    width: 141,
    height: 43,
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
